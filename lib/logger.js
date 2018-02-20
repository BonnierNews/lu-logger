"use strict";

const path = require("path");
const winston = require("winston");
const continuationLocalStorage = require("continuation-local-storage");

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

function init(options) {
  if (!options || !options.config || !options.namespace) {
    throw new Error(`Error initializing logger, one or more options missing: ${JSON.stringify(options)}`);
  }

  const config = options.config;
  const logLevel = config.logLevel || "info";
  const logger = createLogger(logLevel);

  function prepLogObject(level, logObject) {
    if (!logObject) {
      logObject = {};
    } else {
      logObject = JSON.parse(JSON.stringify(logObject));
    }

    if (typeof logObject === "string") {
      logObject = {
        text: logObject
      };
    }
    if (Array.isArray(logObject)) {
      logObject = {
        array: logObject
      };
    }

    logObject.greenFieldLogMeta = {};

    if (level === logLevels.debug) {
      logObject.greenFieldLogMeta.location = getLoc();
    }

    const namespace = continuationLocalStorage.getNamespace(options.namespace);
    if (namespace) {
      logObject.greenFieldLogMeta.correlationId = namespace.get("correlationId");
    }

    return logObject;
  }


  function createLogger(level) {
    // TODO: File path not necessarily root
    const fileName = path.join(__dirname, "..", "logs", `${process.env.NODE_ENV || "development"}.log`);

    const transports = [];
    if (config.log === "file") {
      transports.push(new winston.transports.File({
        filename: fileName
      }));
    }

    if (config.log === "stdout") {
      transports.push(new winston.transports.Console({
        colorize: false,
        timestamp: true,
        json: true
      }));
    }

    return new winston.Logger({
      levels: logLevels,
      level: level,
      transports: transports
    });
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
