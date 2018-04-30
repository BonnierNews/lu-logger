"use strict";
const winston = require("winston");
const util = require()

class ConsoleTransport extends winston.transports.File {
  log(...args) {
    super.log(util.format(...args), args[args.length -1]);
  }
}
module.exports = ConsoleTransport;
