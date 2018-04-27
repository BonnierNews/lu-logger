"use strict";

const appConfig = require("exp-config");
const winston = require("winston");
const path = require("path");
require("winston-syslog").Syslog; // eslint-disable-line no-unused-expressions

const PromTransport = require("./lib/prom-transport");
const callingAppName = require(`${process.cwd()}/package.json`).name;
const config = appConfig.logging;

const transports = [new PromTransport()];

if (appConfig.envName === "test") {
  transports.push(require("./test/helpers/test-transport"));
}

if (config.log === "file") {
  const fileName = path.join(process.cwd(), "logs", `${appConfig.envName}.log`);
  const options = config.truncateLog ? { flags: "w" } : { flags: "a" };
  transports.push(new winston.transports.File({
    filename: fileName,
    json: config.logJson,
    options: options,
    stringify,
    prettyPrint: true
  }));
}

if (config.log === "stdout") {
  transports.push(new winston.transports.Console({
    colorize: false,
    timestamp: true,
    json: config.logJson,
    stringify
  }));
}

if (config.sysLogOpts) {
  transports.push(new winston.transports.Syslog(Object.assign({
    localhost: process.env.HOSTNAME,
    app_name: callingAppName, // eslint-disable-line camelcase
    eol: "\n",
    json: config.logJson,
    stringify
  }, config.sysLogOpts)));
}

function stringify(obj) {
  return config.logJson ? JSON.stringify(obj) : obj.replace(/\n/g, " ");
}

module.exports = winston.createLogger({
  level: config.logLevel || "info",
  transports: transports
});
