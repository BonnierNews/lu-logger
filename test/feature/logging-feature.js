import config from "exp-config";

import { logger } from "../../index.js";
import { getLastLogAsJson } from "../helpers/test-transport.js";

Feature("Logging", () => {
  Scenario("Logging debug with JSON format", () => {
    const message = "Message";
    const data = {
      meta: {
        createdAt: "2017-09-24-00:00T00:00:00.000Z",
        updatedAt: "2017-09-24-00:00T00:00:00.000Z",
        correlationId: "sample-correlation-id",
      },
    };

    When("doing some JSON logging", () => {
      logger.debug(message, data);
    });

    Then("log output should be JSON", () => {
      const logContent = getLastLogAsJson();
      logContent.metaData.should.deep.equal(data);
      logContent.message.should.equal(message);
      logContent.location.should.be.ok;
    });
  });

  Scenario("Logging a too big message JSON format, default behaviour (in config)", () => {
    const message = "Message".repeat(9000);
    const data = {
      meta: {
        createdAt: "2017-09-24-00:00T00:00:00.000Z",
        updatedAt: "2017-09-24-00:00T00:00:00.000Z",
        correlationId: "sample-correlation-id",
      },
    };

    When("logging a huge message", () => {
      logger.debug(message, data);
    });

    Then("log output should be a message that it is too big to log", () => {
      const logContent = getLastLogAsJson();
      logContent.metaData.should.deep.equal(data);
      logContent.message.should.equal("too big to log");
    });
  });

  Scenario("Logging a too big message JSON format, default behaviour (no config)", () => {
    const message = "Message".repeat(9000);
    const data = {
      meta: {
        createdAt: "2017-09-24-00:00T00:00:00.000Z",
        updatedAt: "2017-09-24-00:00T00:00:00.000Z",
        correlationId: "sample-correlation-id",
      },
    };

    Given("we have no config for handling big logs", () => {
      delete config.handleBigLogs;
    });

    When("logging a huge message", () => {
      logger.debug(message, data);
    });

    Then("log output should be a message that it is too big to log", () => {
      const logContent = getLastLogAsJson();
      logContent.metaData.should.deep.equal(data);
      logContent.message.should.equal("too big to log");
    });
  });

  Scenario("Logging a too big message JSON format, truncate it", () => {
    const message = "Message".repeat(9000);
    const data = {
      meta: {
        createdAt: "2017-09-24-00:00T00:00:00.000Z",
        updatedAt: "2017-09-24-00:00T00:00:00.000Z",
        correlationId: "sample-correlation-id",
      },
    };

    Given("we want to truncate big logs", () => {
      config.handleBigLogs = "truncate";
    });

    When("logging a huge message", () => {
      logger.debug(message, data);
    });

    Then("log output should be the first 60 * 1024 bytes of the message", () => {
      const logContent = getLastLogAsJson();
      logContent.metaData.should.deep.equal(data);
      logContent.message.should.equal(`${message.substring(0, 60 * 1024 - 3)}...`);
    });
  });

  Scenario("Logging a huge message JSON format, truncate it", () => {
    const message = "{email: test@example.com}".repeat(9000000); // more than 200MB
    const data = {
      meta: {
        createdAt: "2017-09-24-00:00T00:00:00.000Z",
        updatedAt: "2017-09-24-00:00T00:00:00.000Z",
        correlationId: "sample-correlation-id",
      },
    };

    Given("we want to truncate big logs", () => {
      config.handleBigLogs = "truncate";
    });

    When("logging a huge message", () => {
      logger.debug(message, data);
    });

    Then("log output should be the first 60 * 1024 bytes of the message", () => {
      const logContent = getLastLogAsJson();
      logContent.metaData.should.deep.equal(data);
      logContent.message.should.equal(`${message.substring(0, 60 * 1024 - 3)}...`);
    });
  });
});
