"use strict";

const config = require("exp-config");
config.logging.datadog.apiKey = "<find-it-use-it-love-it>";

try {
  const {logger} = require("../index");
  logger.info(`Testing Datadog implementation in lu-logger - one-shot`);
} catch (err) {
  console.log(`Error: ${err}`); // eslint-disable-line
}
