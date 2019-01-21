"use strict";
const path = require("path");

function getLoc(stackLevel = 10) {
  const originalPrepareStackTrace = Error.prepareStackTrace;
  Error.prepareStackTrace = (_, stack) => stack;
  const stack = new Error().stack[stackLevel];
  Error.prepareStackTrace = originalPrepareStackTrace;

  let calleePath;
  if (process.cwd()) {
    calleePath = path.relative(process.cwd(), stack.getFileName());
  } else {
    calleePath = stack.getFileName();
  }

  return `${calleePath}:${stack.getLineNumber()}`;
}

/**
 * Module wrapper of @substack's `caller.js` (stolen from https://github.com/totherik/caller/blob/master/index.js)
 * @original: https://github.com/substack/node-resolve/blob/master/lib/caller.js
 * @blessings: https://twitter.com/eriktoth/statuses/413719312273125377
 * @see https://code.google.com/p/v8/wiki/JavaScriptStackTraceApi
 */
function caller(depth) {
  let stack, file, frame;

  const pst = Error.prepareStackTrace;
  Error.prepareStackTrace = function (_, innerStack) {
    Error.prepareStackTrace = pst;
    return innerStack;
  };

  stack = new Error().stack;
  depth = !depth || isNaN(depth) ? 1 : depth > stack.length - 2 ? stack.length - 2 : depth;
  stack = stack.slice(depth + 1);

  do {
    frame = stack.shift();
    file = frame && frame.getFileName();
  } while (stack.length && file === "module.js");

  return file;
}

module.exports = {
  getLoc,
  caller
};
