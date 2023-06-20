"use strict";
const util = require("util");
const isEqual = require("lodash.isequal");

function splatEntry(info) {
  const splat = info[Symbol.for("splat")];
  const message = splat ? [...splat] : [];

  if (isMetaData(info.message, message)) {
    if (isEmpty(info.metaData) || includes(info.metaData, message)) {
      info.metaData = message.pop();
    }
  }

  info.message = util.format(info.message, ...message);

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
