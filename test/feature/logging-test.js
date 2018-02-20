"use strict";

const continuationLocalStorage = require("continuation-local-storage");
const intercept = require("intercept-stdout");

Feature("Logging", () => {
  Scenario("Initializing the logger and doing some logging", () => {
    let logger;
    let unhook;
    let stdoutContents = "";

    const options = {
      namespace: "correlationId",
      config: {
        "log": "stdout",
        "logLevel": "debug"
      }
    };
    const message = "Message";
    const corrId = "sample-correlation-id";
    const meta = {meta: {data: "meta-data"}};

    Given("some options", () => {
      options.should.be.an("object");
    });

    When("initializing the logger and doing some logging", () => {
      logger = require("../../lib/logger")(options);

      const namespace = continuationLocalStorage.createNamespace(options.namespace);
      namespace.run(() => {
        namespace.set("correlationId", corrId);

        unhook = intercept((txt) => {
          stdoutContents += txt;
        });

        logger.debug(message, meta);

        unhook();
      });
    });

    Then("correlation id should be output in the log", () => {
      const logContent = JSON.parse(stdoutContents.trim());
      logContent.meta.should.deep.equal(meta.meta);
      logContent.greenFieldLogMeta.correlationId.should.equal(corrId);
      logContent.message.should.equal(message);
    });
  });
});
