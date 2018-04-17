"use strict";

const path = require("path");
const winston = require("winston");
/* eslint-disable no-unused-expressions */
require("winston-syslog").Syslog;
const prometheusClient = require("prom-client");

const logLevels = {
  emerg: 0,
  alert: 1,
  crit: 2,
  error: 3,
  warning: 4,
  notice: 5,
  info: 6,
  debug: 7
};

const invertedLevels = Object.assign({}, ...Object.entries(logLevels).map(([a, b]) => ({ [b]: a })));

function init(config) {
  if (!config) {
    throw new Error("Error initializing logger, configuration object missing");
  }

  let callingAppName = require(`${process.cwd()}/package.json`).name;
  callingAppName = !callingAppName ? "undefined" : callingAppName.replace(/-/g, "");

  const logCounterName = `${callingAppName}_logged_total`;

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

  const root = path.resolve(__dirname.split("node_modules")[0]);
  const fileName = path.join(root, "logs", `${process.env.NODE_ENV || "development"}.log`);

  const transports = [];
  if (config.log === "file") {
    transports.push(new winston.transports.File({
      filename: fileName,
      json: logJson,
      stringify: (obj) => logJson ? JSON.stringify(obj) : obj.split("\n").join(" "),
    }));
  }

  if (config.log === "stdout") {
    transports.push(new winston.transports.Console({
      colorize: false,
      timestamp: true,
      json: logJson,
      stringify: (obj) => logJson ? JSON.stringify(obj) : obj.split("\n").join(" "),
    }));
  }

  if (config.sysLogOpts) {
    transports.push(new winston.transports.Syslog(Object.assign({
      localhost: process.env.HOSTNAME,
      eol: "\n",
      json: logJson,
      stringify: (obj) => logJson ? JSON.stringify(obj) : obj.split("\n").join(" ")
    }, config.sysLogOpts)));
  }

  const logger = new winston.Logger({
    levels: logLevels,
    level: logLevel,
    transports: transports
  });

  function prepLogObject(level, logObject) {
    if (!logObject) {
      logObject = {};
    } else {
      logObject = JSON.parse(JSON.stringify(logObject));
    }

    const logData = {metaData: logObject};

    if (level === logLevels.debug) {
      logData.location = getLoc();
    }

    logData.logLevel = invertedLevels[level];

    return logData;
  }

  return {
    emergency: (label, logObject) => {
      logger.emerg(label, prepLogObject(logLevels.emerg, logObject));
      logCounter.inc({ level: "emergency" });
    },

    alert: (label, logObject) => {
      logger.alert(label, prepLogObject(logLevels.alert, logObject));
      logCounter.inc({ level: "alert" });
    },

    critical: (label, logObject) => {
      logger.crit(label, prepLogObject(logLevels.crit, logObject));
      logCounter.inc({ level: "crit" });
    },

    error: (label, logObject) => {
      logger.error(label, prepLogObject(logLevels.error, logObject));
      logCounter.inc({ level: "error" });
    },

    warning: (label, logObject) => {
      logger.warning(label, prepLogObject(logLevels.warning, logObject));
      logCounter.inc({ level: "warning" });
    },

    notice: (label, logObject) => {
      logger.notice(label, prepLogObject(logLevels.notice, logObject));
      logCounter.inc({ level: "notice" });
    },

    info: (label, logObject) => {
      logger.info(label, prepLogObject(logLevels.info, logObject));
      logCounter.inc({ level: "info" });
    },

    debug: (label, logObject) => {
      logger.debug(label, prepLogObject(logLevels.debug, logObject));
      logCounter.inc({ level: "debug" });
    },
  };
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
