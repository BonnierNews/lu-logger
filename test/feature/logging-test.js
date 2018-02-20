"use strict";

const continuationLocalStorage = require("continuation-local-storage");
const intercept = require("intercept-stdout");

const constants = require("../../lib/constants");

Feature("Logging", () => {
  Scenario("Initializing the logger and doing some logging", () => {
    let logger;
    let unhook;
    let stdoutContents = "";

    const config = {
      "log": "stdout",
      "logLevel": "debug",
      "logJson": true
    };
    const message = "Message";
    const corrId = "sample-correlation-id";
    const data = {data: "meta-data"};

    Given("some options", () => {
      config.should.be.an("object");
    });

    When("initializing the logger and doing some logging", () => {
      logger = require("../../lib/logger")(config);

      const namespace = continuationLocalStorage.createNamespace(constants.namespace);
      namespace.run(() => {
        namespace.set("correlationId", corrId);

        unhook = intercept((txt) => {
          stdoutContents += txt;
        });

        logger.debug(message, data);

        unhook();
      });
    });

    Then("correlation id should be output in the log", () => {
      const logContent = JSON.parse(stdoutContents.trim());
      logContent.data.should.deep.equal(data);
      logContent.greenFieldLogMeta.correlationId.should.equal(corrId);
      logContent.message.should.equal(message);
    });
  });
});
