"use strict";

const Transport = require("winston-transport");


class CustomTransport extends Transport {
  constructor(opts) {
    super(opts);
    this.name = "test-transport";
    this.logs = [];
  }
  log(level, message, meta) {
    this.logs.push({level, message, meta});
  }
}

module.exports = new CustomTransport();
