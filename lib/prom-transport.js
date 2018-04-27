"use strict";

const Transport = require("winston-transport");
const prometheusClient = require("prom-client");
const callingAppName = require(`${process.cwd()}/package.json`).name;

class PromTransport extends Transport {
  constructor(opts) {
    super(opts);
    this.name = "prom-transport";
    const callingAppMetricName = callingAppName && callingAppName.replace(/-/g, "");
    const logCounterName = `${callingAppMetricName}_logged_total`;
    this.logCounter = prometheusClient.register.getSingleMetric(logCounterName);

    if (!this.logCounter) {
      this.logCounter = new prometheusClient.Counter({
        name: logCounterName,
        help: "Counts number of logs with loglevel as label",
        labelNames: ["level"]
      });
    }
  }
  log(level) {
    this.logCounter.inc({level});
  }
}

module.exports = PromTransport;
