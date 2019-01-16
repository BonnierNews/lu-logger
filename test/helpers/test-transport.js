"use strict";

const Transport = require("winston-transport");
class CustomTransport extends Transport {
  constructor(opts) {
    super(opts);
    this.name = "test-transport";
    this.logs = [];
  }
  log(info, callback) {
    let message = info.message;
    if (!message) {
      message = info[Symbol.for("message")];
      info._message = message;
      message = JSON.parse(message)["@message"];
    }
    this.logs.push({...info, message});
    callback();
  }
}

module.exports = new CustomTransport();
