"use strict";

const createLogger = require("../../lib/logger");
const intercept = require("intercept-stdout");
const prometheusClient = require("prom-client");

Feature("Logging", () => {
  Scenario("Logging with JSON format", () => {
    let unhook;
    let stdoutContents = "";

    const config = {
      "log": "stdout",
      "logLevel": "debug",
      "logJson": true
    };
    const message = "Message";
    const data = {
      "meta": {
        "createdAt": "2017-09-24-00:00T00:00:00.000Z",
        "updatedAt": "2017-09-24-00:00T00:00:00.000Z",
        "correlationId": "sample-correlation-id"
      }
    };

    When("initializing the logger and doing some JSON logging", () => {
      const logger = createLogger(config);

      unhook = intercept((txt) => {
        stdoutContents += txt;
      });

      logger.debug(message, data);

      unhook();
    });

    Then("log output should be JSON", () => {
      const logContent = JSON.parse(stdoutContents.trim());
      logContent.metaData.should.deep.equal(data);
      logContent.message.should.equal(message);
    });
  });

  Scenario("Logging with string format", () => {
    let unhook;
    let stdoutContents = "";

    const config = {
      "log": "stdout",
      "logLevel": "debug",
      "logJson": false
    };
    const message = "Message";
    const data = {
      "meta": {
        "createdAt": "2017-09-24-00:00T00:00:00.000Z",
        "updatedAt": "2017-09-24-00:00T00:00:00.000Z",
        "correlationId": "sample-correlation-id"
      }
    };

    When("initializing the logger and doing some string logging", () => {
      const logger = createLogger(config);

      unhook = intercept((txt) => {
        stdoutContents += txt;
      });

      logger.debug(message, data);

      unhook();
    });

    Then("log output should be string", (done) => {
      stdoutContents.should.be.a("string");

      try {
        JSON.parse(stdoutContents);
        done("No error thrown");
      } catch (err) {
        done();
      }
    });
  });

  Scenario("Logging should inc metric", () => {
    const config = {
      "log": "stdout",
      "logLevel": "debug",
      "logJson": false,
      "metricPrefix": "test"
    };
    const message = "Message";

    When("initializing the logger and doing some string logging", () => {
      const logger = createLogger(config);

      logger.emergency(message);

      logger.alert(message);
      logger.alert(message);

      logger.critical(message);
      logger.critical(message);
      logger.critical(message);

      logger.error(message);
      logger.error(message);
      logger.error(message);
      logger.error(message);

      logger.warning(message);
      logger.warning(message);
      logger.warning(message);
      logger.warning(message);
      logger.warning(message);
    });

    Then("the logCounter metric should be incremented", () => {

      const counterMetric = prometheusClient.register.getSingleMetric(`${config.metricPrefix}_logged_total`);

      const emergencyCount = counterMetric.hashMap["level:emergency"].value;
      const alertCount = counterMetric.hashMap["level:alert"].value;
      const criticalCount = counterMetric.hashMap["level:crit"].value;
      const errorCount = counterMetric.hashMap["level:error"].value;
      const warningCount = counterMetric.hashMap["level:warning"].value;

      emergencyCount.should.eql(1);
      alertCount.should.eql(2);
      criticalCount.should.eql(3);
      errorCount.should.eql(4);
      warningCount.should.eql(5);
    });
  });
});
