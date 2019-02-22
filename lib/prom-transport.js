"use strict";

const Transport = require("winston-transport");
const prometheusClient = require("prom-client");
const callingAppName = require(`${process.cwd()}/package.json`).name;
const getEventName = require("./get-event-name");

class PromTransport extends Transport {
  constructor(opts) {
    super(opts);
    this.name = "prom-transport";
    const callingAppMetricName = callingAppName && callingAppName.replace(/^@[^/]*\//, "").replace(/-/g, "");
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
  log(info, callback) {
    const metricLabels = {level: info.level};
    if (info.level === "error") {
      const eventName = getEventName(info.metaData);
      if (eventName) {
        metricLabels.eventName = eventName;
      } else {
        metricLabels.eventName = "";
      }
    }
    this.logCounter.inc(metricLabels);
    callback();
  }
}

module.exports = PromTransport;
