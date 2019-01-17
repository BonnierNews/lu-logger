"use strict";
const util = require("util");
const config = require("exp-config").logging;

function splatEntry(info, opts) {
  const splat = info[Symbol.for("splat")];
  if (!splat || splat.length === 1) {
    return info;
  }

  const message = [...splat];
  if (!opts.metaData && typeof message[message.length - 1] === "object") {
    info.metaData = message.pop();
  }

  info.message = util.format(info.message, ...message);
  if (!config.pretty) {
    info.message = info.message.replace(/\n\s*/gm, " ");
  }
  return info;
}

module.exports = splatEntry;
