"use strict";

const appConfig = require("exp-config");
const winston = require("winston");
const {format} = winston;
const path = require("path");
const fs = require("fs");
const callingAppName = require(`${process.cwd()}/package.json`).name;
const splatEntry = require("./lib/splat-entry");
const logLevels = require("./config/levels");
const {getLoc} = require("./lib/get-loc");
const stringify = require("./lib/stringify");

require("winston-syslog").Syslog; // eslint-disable-line no-unused-expressions

const PromTransport = require("./lib/prom-transport");
const config = appConfig.logging;

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
  if (Buffer.byteLength(info.message, "utf8") > 60 * 1024) {
    info.message = "too big to log";
  }
  return info;
}

function metaDataFormat(info) {
  const meta = info.metaData && info.metaData.meta;
  if (!meta && Object.keys(info.metaData).length > 0) {
    info.metaData = {meta: info.metaData};
  }
  return info;
}

function defaultFormatter() {
  return format.printf((info) => {
    const meta = Object.keys(info).reduce(
      (acc, key) => {
        if (!["message", "metaData", "level"].includes(key)) {
          acc[key] = info[key];
        }
        return acc;
      },
      {...info.metaData}
    );

    return `${info.timestamp} - ${info.level}: ${info.message}\t${stringify(meta)}`;
  });
}

const transports = [new PromTransport()];

const formatter = config.logJson ? format.json() : defaultFormatter();

if (config.log === "file") {
  transports.push(
    new winston.transports.File({
      filename: logFilename()
    })
  );
}

if (config.log === "stdout") {
  transports.push(new winston.transports.Console());
}

if (config.sysLogOpts) {
  transports.push(
    new winston.transports.Syslog(
      Object.assign(
        {
          type: "RFC5424",
          localhost: process.env.HOSTNAME,
          app_name: callingAppName, // eslint-disable-line camelcase
          eol: "\n"
        },
        config.sysLogOpts
      )
    )
  );
}

const logger = winston.createLogger({
  level: config.logLevel || "info",
  levels: logLevels.levels,
  colors: logLevel.colors,
  transports: transports,
  exceptionHandlers: [new winston.transports.Console()],
  exitOnError: appConfig.envName !== "production",
  format: format.combine(
    format.metadata({key: "metaData"}),
    format(splatEntry)(),
    format.timestamp(),
    format(logLevel)(),
    format(location)(),
    format(truncateTooLong)(),
    format(metaDataFormat)(),
    formatter
  )
});

module.exports = {
  logger,
  buildLogger: logger.child.bind(logger)
};
