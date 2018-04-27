"use strict";
const path = require("path");

function getLoc() {
  const originalPrepareStackTrace = Error.prepareStackTrace;
  Error.prepareStackTrace = (_, stack) => stack;
  const stack = new Error().stack[3];
  Error.prepareStackTrace = originalPrepareStackTrace;

  let calleePath;
  if (process.cwd()) {
    calleePath = path.relative(process.cwd(), stack.getFileName());
  } else {
    calleePath = stack.getFileName();
  }

  return `${calleePath}:${stack.getLineNumber()}`;
}

module.exports = getLoc;
