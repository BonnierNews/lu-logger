"use strict";
const util = require("util");
const config = require("exp-config").logging;
const isEqual = require("lodash.isequal");

function splatEntry(info) {
  const splat = info[Symbol.for("splat")];
  if (!splat) return info;

  const message = [...splat];
  const last = message[message.length - 1];
  if (typeof last === "object") {
    if (isEmpty(info.metaData) || isEqual(info.metaData, last)) {
      info.metaData = message.pop();
    }
  }

  info.message = util.format(info.message, ...message);
  if (!config.pretty) {
    info.message = info.message.replace(/\n\s*/gm, " ");
  }
  return info;
}

function isEmpty(obj) {
  return !obj || isEqual(obj, {});
}

module.exports = splatEntry;
