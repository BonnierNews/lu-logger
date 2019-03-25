"use strict";
const util = require("util");
const config = require("exp-config").logging;
const isEqual = require("lodash.isequal");

function splatEntry(info) {
  // info.metaData = {};
  const splat = info[Symbol.for("splat")];
  if (!splat) return info;
  const message = [...splat];
  // const last = message[message.length - 1];

  if (isMetaData(info.message, message)) {
    if (isEmpty(info.metaData) || includes(info.metaData, message)) {
      info.metaData = message.pop();
    }
  }
  info.message = util.format(info.message, ...message);

  if (!config.pretty) {
    info.message = info.message.replace(/\n\s*/gm, " ");
  }
  return info;
}

function isMetaData(infoMessage, message) {
  // The last part can be part of the message if the message is formatted using %j or %o or something
  const copy = [...message];
  const last = copy.pop();

  if (typeof last !== "object") {
    return false;
  }

  const unformatted = `${util.format(infoMessage, ...copy)} ${util.format(last)}`;
  const formatted = util.format(infoMessage, ...copy, last);

  return unformatted.length === formatted.length;
}

function isEmpty(obj) {
  return !obj || isEqual(obj, {});
}

function includes(message, messages) {
  return messages.find((m) => {
    return isEqual(m, message);
  });
}

module.exports = splatEntry;
