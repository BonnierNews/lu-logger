/**
 * Code borrowed from https://github.com/itsfadnis/datadog-winston
 *
 * That repository isn't updated very often these days, not even with
 * security patches.
 *
 * Minor changes made to the code in order for it to suit this repo.
 */

"use strict";

const CircuitBreaker = require("opossum");
const fetch = require("node-fetch");
const https = require("https");
const Transport = require("winston-transport");
const querystring = require("querystring");

const httpsAgent = new https.Agent({keepAlive: true, maxSockets: Infinity});

const circuitBreakerOptions = {
  timeout: 2000, // If our function takes longer than 2 seconds, trigger a failure.
  errorThresholdPercentage: 50, // When 50% of requests fail, trip the circuit
  resetTimeout: 30000 // After 30 seconds, try again.
};
const logCircuitBreaker = new CircuitBreaker(makeRequest, circuitBreakerOptions);
logCircuitBreaker.fallback(() => {});

/**
 * Class for sending logging information to Datadog's HTTPS intakes
 * @extends Transport
 */
module.exports = class DatadogTransport extends Transport {
  /**
   * Constructor for the Datadog Transport responsible for making
   * HTTP requests whenever log messages are received
   * @param {!Object} opts Transport options
   * @param {string} opts.apiKey The Datadog API key
   * @param {string} [intakeRegion] The intake region to be used
   */
  constructor(opts = {}) {
    super(opts);

    if (!opts.apiKey) {
      throw new Error("Missing required option: `apiKey`");
    }

    this.opts = opts;
    if (this.opts.intakeRegion === "eu") {
      this.api = `https://http-intake.logs.datadoghq.eu/v1/input/${opts.apiKey}`;
    } else if (this.opts.intakeRegion === "us3") {
      this.api = `https://http-intake.logs.us3.datadoghq.com/v1/input/${opts.apiKey}`;
    } else if (this.opts.intakeRegion === "us5") {
      this.api = `https://http-intake.logs.us5.datadoghq.com/v1/input/${opts.apiKey}`;
    } else {
      this.api = `https://http-intake.logs.datadoghq.com/v1/input/${opts.apiKey}`;
    }
  }

  /**
   * Expose the name of the Transport
   */
  get name() {
    return "datadog";
  }

  /**
   * Expose the complete API URL set
   */
  apiUrl() {
    return this.api;
  }

  /**
   * Core logging method exposed to Winston
   * @param {!Object} info Information to be logged
   * @param {function} callback Continuation to respond when complete
   */
  log(info, callback) {
    setImmediate(() => {
      this.emit("logged", info);
    });

    const query = ["service", "ddsource", "ddtags", "hostname"].reduce((a, b) => {
      if (Object.prototype.hasOwnProperty.call(this.opts, b)) {
        a[b] = this.opts[b];
      }

      return a;
    }, {});

    const {ddtags, ...logs} = info;

    const append = (string) => {
      if (query.ddtags) {
        query.ddtags += `,${string}`;
      } else {
        query.ddtags = string;
      }
    };

    if (info.dd) {
      append(`trace_id:${info.dd.trace_id},span_id:${info.dd.span_id}`);
    }

    if (ddtags) {
      append(ddtags);
    }

    const queryString = querystring.encode(query);
    const api = querystring ? `${this.api}?${queryString}` : this.api;

    try {
      logCircuitBreaker.fire(api, logs);
    } catch (err) {
      // ignore
    } finally {
      callback(); // eslint-disable-line callback-return
    }
  }
};

function makeRequest(api, logs) {
  return new Promise((resolve) => {
    fetch(api, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      httpsAgent,
      body: JSON.stringify(logs)
    })
      .then(() => {
        resolve(true);
      })
      .catch(() => {});
  });
}
