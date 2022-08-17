"use strict";
const util = require("util");
const config = require("exp-config").logging;

function stringify(...args) {
  const message = util.format(...args);
  if (!config.pretty) {
    const noapikey =
      /(["]?(x-)?api-key["]?[:=]["]?)(([\s]?["]?[0-9a-fA-F]){8}-([0-9a-fA-F]{4}-){3}[0-9a-fA-F]{12}["]?)/gi;
    return message.replace(/\n\s*/gm, " ").replace(noapikey, /\1SECRET/);
  }
  return message;
}

module.exports = stringify;
