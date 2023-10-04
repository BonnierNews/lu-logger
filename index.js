"use strict";

const appConfig = require("exp-config");
const fs = require("fs");
const path = require("path");
const winston = require("winston");
const { format } = winston;

const { getLoc } = require("./lib/get-loc");
const logLevels = require("./config/levels");
const splatEntry = require("./lib/splat-entry");
const cleanEntry = require("./lib/clean-entry");
const stringify = require("./lib/stringify");
const { debugMetaFormat, initDebugMetaMiddleware: initMiddleware, getDebugMeta } = require("./lib/debug-meta");

const PromTransport = require("./lib/prom-transport");
const maxMessageLength = 60 * 1024;
const config = appConfig.logging ?? {};

if (config.truncateLog) {
  const fname = logFilename();
  if (fs.existsSync(fname)) fs.truncateSync(fname);
}

function logLevel(info) {
  info.logLevel = logLevels.aliases[info.level] || info.level;
  return info;
}

function location(info) {
  info.location = getLoc();
  return info;
}

function logFilename() {
  return path.join(process.cwd(), "logs", `${appConfig.envName}.log`);
}

function truncateTooLong(info) {
  if (Buffer.byteLength(info.message, "utf8") > maxMessageLength) {
    switch (appConfig.handleBigLogs) {
      case "truncate":
        info.message = `${info.message.substring(0, maxMessageLength - 3)}...`;
        break;
      default:
        info.message = "too big to log";
        break;
    }
  }
  return info;
}

function metaDataFormat(info) {
  const meta = info.metaData && info.metaData.meta;
  if (!meta && Object.keys(info.metaData).length > 0) {
    info.metaData = { meta: info.metaData };
  }
  return info;
}

function defaultFormatter() {
  return format.printf((info) => {
    const meta = Object.keys(info).reduce(
      (acc, key) => {
        if (![ "message", "metaData", "level" ].includes(key)) {
          acc[key] = info[key];
        }
        return acc;
      },
      { ...info.metaData }
    );

    return `${info.timestamp} - ${info.level}: ${info.message}\t${stringify(meta)}`;
  });
}

const transports = [ new PromTransport() ];

if (config.log === "file") {
  transports.push(
    new winston.transports.File({ filename: logFilename() })
  );
}

if (config.log === "stdout") {
  transports.push(new winston.transports.Console());
}

if (config.log === "/dev/null") {
  transports.length = 0;
}

const formatter = config.logJson ? format.json() : defaultFormatter();

const logger = winston.createLogger({
  level: config.logLevel || "info",
  levels: logLevels.levels,
  colors: logLevel.colors,
  transports,
  exceptionHandlers: [ new winston.transports.Console() ],
  exitOnError: appConfig.envName !== "production",
  format: format.combine(
    format.metadata({ key: "metaData" }),
    format(splatEntry)(),
    format(truncateTooLong)(),
    format(cleanEntry)(),
    format.timestamp(),
    format(logLevel)(),
    format(location)(),
    format(metaDataFormat)(),
    format(debugMetaFormat)(),
    formatter
  ),
});

module.exports = {
  logger,
  buildLogger: logger.child.bind(logger),
  debugMeta: { initMiddleware, getDebugMeta },
};
