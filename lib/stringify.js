"use strict";
const util = require("util");
const config = require("exp-config").logging;

function stringify(...args) {
  const message = util.format(...args);
  if (!config.pretty) {
    return message.replace(/\n\s*/gm, " ");
  }
  return message;
}

module.exports = stringify;
