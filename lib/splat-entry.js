"use strict";
const util = require("util");
const config = require("exp-config").logging;
const isEqual = require("lodash.isequal");

function splatEntry(info) {
  const splat = info[Symbol.for("splat")];
  const message = splat ? [...splat] : [];

  if (isMetaData(info.message, message)) {
    if (isEmpty(info.metaData) || includes(info.metaData, message)) {
      info.metaData = message.pop();
    }
  }
  const noapikey =
    /([\\"]{0,}(x-)?api-key[\\"]{0,}[:=][\\"]{0,})(([\s]?[\\"]?[0-9a-fA-F]){8}-([0-9a-fA-F]{4}-){3}[0-9a-fA-F]{12})([\\"]{0,})/gi;
  const noAuth = /([\\"]+)auth([\\"]+:)({|\n)([^}]*})/gi;
  const maskEmail = /([\\"]+[a-z])[^"{}@]+@([a-z0-9.]+[\\"]+)/gi;
  const maskName = /([\\"]+(firstName|lastName)[\\"]+:)([\\"]+[a-z])[^"{}]+([\\"]+)/gi;

  info.message = util
    .format(info.message, ...message)
    .replace(noapikey, "$1SECRET$6")
    .replace(noAuth, "$1auth$2$1SECRET$1")
    .replace(maskEmail, "$1xxx@$2")
    .replace(maskName, "$1$3xxx$4");

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
