/**
 * Code borrowed from https://github.com/itsfadnis/datadog-winston
 *
 * That repository isn't updated very often these days, not even with
 * security patches.
 *
 * Minor changes made to the code in order for it to suit this repo.
 */

"use strict";

const fetch = require("node-fetch");
const Transport = require("winston-transport");
const querystring = require("querystring");

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
      fetch(api, {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify(logs)
      });
    } catch (err) {
      // ignore
    } finally {
      callback(); // eslint-disable-line callback-return
    }
  }
};
