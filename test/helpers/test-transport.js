"use strict";

const Transport = require("winston-transport");


class CustomTransport extends Transport {
  constructor(opts) {
    super(opts);
    this.name = "test-transport";
    this.logs = [];
  }
  log(info, callback) {
    const {level, message, meta} = info;
    this.logs.push({level, message, meta});
    callback();
  }
}

module.exports = new CustomTransport();
