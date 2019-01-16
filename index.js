"use strict";

const appConfig = require("exp-config");
const winston = require("winston");
const {format} = winston;
const path = require("path");
const callingAppName = require(`${process.cwd()}/package.json`).name;
const splatEntry = require("./lib/splat-entry");
const logLevels = require("./config/levels");

require("winston-syslog").Syslog; // eslint-disable-line no-unused-expressions

const PromTransport = require("./lib/prom-transport");
const config = appConfig.logging;
const transports = [new PromTransport()];

const defaultFormatter = format.printf((info) => `${info.timestamp} - ${info.level}: ${info.message}`);
const formatter = config.logJson ? format.logstash() : defaultFormatter;

if (config.log === "file") {
  const fileName = path.join(process.cwd(), "logs", `${appConfig.envName}.log`);
  const options = config.truncateLog ? {flags: "w"} : {flags: "a"};
  transports.push(new winston.transports.File({
    filename: fileName,
    options: options
  }));
}

if (config.log === "stdout") {
  transports.push(new winston.transports.Console());
}

if (config.sysLogOpts) {
  transports.push(new winston.transports.Syslog(Object.assign({
    localhost: process.env.HOSTNAME,
    app_name: callingAppName, // eslint-disable-line camelcase
    eol: "\n"
  }, config.sysLogOpts)));
}

function logLevel(info) {
  info.logLevel = info.level;
  return info;
}

const logger = winston.createLogger({
  level: config.logLevel || "info",
  levels: logLevels,
  transports: transports,
  format: format.combine(
    format.metadata({key: "metaData"}),
    format.timestamp(),
    format(logLevel)(),
    format(splatEntry)(),
    formatter
  ),
  defaultMeta: {appName: callingAppName},
});

module.exports = {
  logger
};
