"use strict";

const path = require("path");
const winston = require("winston");
const util = require("util");
/* eslint-disable no-unused-expressions */
require("winston-syslog").Syslog;
const prometheusClient = require("prom-client");

const logLevels = [
  {short: "emerg", num: 0, fnName: "emergency"},
  {short: "alert", num: 1, fnName: "alert"},
  {short: "crit", num: 2, fnName: "critical"},
  {short: "error", num: 3, fnName: "error"},
  {short: "warning", num: 4, fnName: "warning"},
  {short: "notice", num: 5, fnName: "notice"},
  {short: "info", num: 6, fnName: "info"},
  {short: "debug", num: 7, fnName: "debug"}
];

const callingAppName = require(`${process.cwd()}/package.json`).name;

function init(config) {
  if (!config) {
    throw new Error("Error initializing logger, configuration object missing");
  }

  const callingAppMetricName = !callingAppName ? "undefined" : callingAppName.replace(/-/g, "");
  const logCounterName = `${callingAppMetricName}_logged_total`;
  let logCounter = prometheusClient.register.getSingleMetric(logCounterName);

  if (!logCounter) {
    logCounter = new prometheusClient.Counter({
      name: logCounterName,
      help: "Counts number of logs with loglevel as label",
      labelNames: ["level"]
    });
  }

  const logLevel = config.logLevel || "info";
  const logJson = (config.logJson === undefined) ? true : config.logJson;

  const root = process.cwd();
  const fileName = path.join(root, "logs", `${process.env.NODE_ENV || "development"}.log`);
  const options = config.truncateLog ? { flags: "w" } : { flags: "a" };

  const stringify = stringifyFn.bind(stringifyFn, logJson);

  const transports = [];
  if (config.log === "file") {
    const transport = new winston.transports.File({
      filename: fileName,
      json: logJson,
      options: options,
      stringify: stringify,
    });

    transports.push(transport);
  }

  if (config.log === "stdout") {
    transports.push(new winston.transports.Console({
      colorize: false,
      timestamp: true,
      json: logJson,
      stringify: stringify,
    }));
  }

  if (config.sysLogOpts) {
    transports.push(new winston.transports.Syslog(Object.assign({
      localhost: process.env.HOSTNAME,
      app_name: callingAppName, // eslint-disable-line camelcase
      eol: "\n",
      json: logJson,
      stringify: stringify
    }, config.sysLogOpts)));
  }

  const logger = new winston.Logger({
    levels: logLevels,
    level: logLevel,
    transports: transports
  });

  function api(logObject = {}) {
    const logs = {};
    logLevels.forEach((level) => {
      logs[level.fnName] = (...args) => {
        const label = util.format(...args);
        logger[level.num](label, prepLogObject(level.num, logObject));
        logCounter.inc({ level: level.fnName });
      };
    });

    logs.winstone = logger;
    return logs;
  }

  return Object.assign(api, api());
}

function prepLogObject(level, logObject, metaData = {}) {
  if (!logObject) {
    logObject = metaData;
  } else {
    logObject = JSON.parse(JSON.stringify(logObject));
  }

  const logData = {metaData: logObject};
  const correlationId = (typeof metaData === "string") ? metaData : null;

  if (metaData) {
    if (logData.metaData && logData.metaData.meta) {
      logData.metaData.meta.correlationId = correlationId;
    } else {
      logData.metaData = { meta: {correlationId}};
    }
  }

  if (level.fnName === "debug" || level.fnName === "error") {
    logData.location = getLoc();
  }

  logData.logLevel = String(level.num);

  return logData;
}

function stringifyFn(logJson, obj) {
  return logJson ? JSON.stringify(obj) : obj.replace(/\n/g, " ");
}

function getLoc() {
  const originalPrepareStackTrace = Error.prepareStackTrace;
  Error.prepareStackTrace = (_, stack) => stack;
  const stack = new Error().stack[3];
  Error.prepareStackTrace = originalPrepareStackTrace;

  let calleePath;
  if (global.__basePath) {
    calleePath = path.relative(global.__basePath, stack.getFileName());
  } else {
    calleePath = stack.getFileName();
  }

  return `${calleePath}:${stack.getLineNumber()}`;
}

module.exports = init;
