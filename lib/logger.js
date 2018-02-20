"use strict";

const path = require("path");
const winston = require("winston");
const continuationLocalStorage = require("continuation-local-storage");

const constants = require("./constants");

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

function init(config) {
  if (!config) {
    throw new Error("Error initializing logger, configuration object missing");
  }

  const logLevel = config.logLevel || "info";
  const logJson = (config.logJson === undefined) ? true : config.logJson;

  const root = path.resolve(__dirname.split("node_modules")[0]);
  const fileName = path.join(root, "logs", `${process.env.NODE_ENV || "development"}.log`);

  const transports = [];
  if (config.log === "file") {
    transports.push(new winston.transports.File({
      filename: fileName,
      json: logJson
    }));
  }

  if (config.log === "stdout") {
    transports.push(new winston.transports.Console({
      colorize: false,
      timestamp: true,
      json: logJson
    }));
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

    const greenFieldLogMeta = {};

    if (level === logLevels.debug) {
      greenFieldLogMeta.location = getLoc();
    }

    const namespace = continuationLocalStorage.getNamespace(constants.namespace);
    if (namespace) {
      greenFieldLogMeta.correlationId = namespace.get("correlationId");
    }

    return {data: logObject, greenFieldLogMeta: greenFieldLogMeta};
  }

  return {
    emergency: (label, logObject) => {
      logger.emerg(label, prepLogObject(logLevels.emerg, logObject));
    },

    alert: (label, logObject) => {
      logger.alert(label, prepLogObject(logLevels.alert, logObject));
    },

    critical: (label, logObject) => {
      logger.crit(label, prepLogObject(logLevels.crit, logObject));
    },

    error: (label, logObject) => {
      logger.error(label, prepLogObject(logLevels.error, logObject));
    },

    warning: (label, logObject) => {
      logger.warning(label, prepLogObject(logLevels.warning, logObject));
    },

    notice: (label, logObject) => {
      logger.notice(label, prepLogObject(logLevels.notice, logObject));
    },

    info: (label, logObject) => {
      logger.info(label, prepLogObject(logLevels.info, logObject));
    },

    debug: (label, logObject) => {
      logger.debug(label, prepLogObject(logLevels.debug, logObject));
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
