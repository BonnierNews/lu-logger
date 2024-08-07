import config from "exp-config";
import fs from "fs";
import path from "path";
import { transports as _transports, createLogger, format } from "winston";

import { levels } from "./config/levels.js";
import cleanEntry from "./lib/clean-entry.js";
import { debugMetaFormat, getDebugMeta, initDebugMetaMiddleware as initMiddleware } from "./lib/debug-meta.js";
import moveGcpFieldsToRoot from "./lib/gcp.js";
import { getLoc } from "./lib/get-loc.js";
import stringify from "./lib/stringify.js";

const maxMessageLength = 60 * 1024;

/* c8 ignore start We only use the file transport in tests */
if (config?.logging?.truncateLog) {
  const fname = logFilename();
  if (fs.existsSync(fname)) fs.truncateSync(fname);
}
/* c8 ignore stop */

function location(info) {
  info.location = getLoc();
  return info;
}

function logFilename() {
  return path.join(process.cwd(), "logs", `${config.envName}.log`);
}

function truncateTooLong(info) {
  if (Buffer.byteLength(info.message, "utf8") > maxMessageLength) {
    switch (config.handleBigLogs) {
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

function addSeverity(info) {
  info.severity = info.level.toUpperCase();
  return info;
}
/* c8 ignore start We only use this formatter for local development */
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
/* c8 ignore stop */

const transports = [];

switch (config?.logging?.log) {
  case "file":
    transports.push(new _transports.File({ filename: logFilename() }));
    break;
  /* c8 ignore next 5 */
  case "stdout":
    transports.push(new _transports.Console());
    break;
  case "/dev/null":
    break;
}

const formatter = config?.logging?.logJson ? format.json() /* c8 ignore next */ : defaultFormatter();

export const logger = createLogger({
  level: config?.logging?.logLevel /* c8 ignore next */ || "info",
  levels,
  transports,
  exceptionHandlers: [ new _transports.Console() ],
  exitOnError: config.envName !== "production",
  format: format.combine(
    format.metadata({ key: "metaData" }),
    format(addSeverity)(),
    format(truncateTooLong)(),
    format(cleanEntry)(),
    format.timestamp(),
    format(location)(),
    format(debugMetaFormat)(),
    format(moveGcpFieldsToRoot)(),
    formatter
  ),
});

export const buildLogger = logger.child.bind(logger);

export const debugMeta = { initMiddleware, getDebugMeta };

export default {
  logger,
  buildLogger,
  debugMeta,
};
