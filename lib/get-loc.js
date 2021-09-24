"use strict";
const path = require("path");

function getLoc(depth) {
  try {
    let stack, file, frame;

    const pst = Error.prepareStackTrace;
    Error.prepareStackTrace = (_, innerStack) => {
      Error.prepareStackTrace = pst;
      return innerStack;
    };

    stack = new Error().stack;
    depth = !depth || isNaN(depth) ? 1 : depth > stack.length - 2 ? stack.length - 2 : depth;
    stack = stack.slice(depth + 1);

    do {
      frame = stack.shift();
      file = frame && frame.getFileName();
    } while ((stack.length && file === "module.js") || file.includes("node_modules"));

    let calleePath;
    if (process.cwd()) {
      calleePath = path.relative(process.cwd(), frame.getFileName());
    } else {
      calleePath = frame.getFileName();
    }

    return `${calleePath}:${frame.getLineNumber()}`;
  } catch (e) {
    return undefined;
  }
}

module.exports = {
  getLoc
};
