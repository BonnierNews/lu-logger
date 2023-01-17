"use strict";

const config = require("exp-config");
config.logging.datadog.apiKey = "<find-it-use-it-love-it>";

try {
  const {buildLogger, logger} = require("../index");
  logger.info("Testing Datadog implementation in lu-logger - one-shot first");
  logger.info("Testing Datadog implementation in lu-logger - one-shot second");

  const bLogger = buildLogger({
    meta: {correlationId: "some-correlation-id", requesterName: "lu-logger", routingKey: "some-routing-key"}
  });

  bLogger.info("Testing Datadog implementation with bLogger in lu-logger - one-shot first");
  bLogger.info("Testing Datadog implementation with bLogger in lu-logger - one-shot second");
} catch (err) {
  console.log(`Error: ${err}`); // eslint-disable-line
}
