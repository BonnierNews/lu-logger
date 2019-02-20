"use strict";

const {logger} = require("../../");
const transport = require("../helpers/test-transport");
const prometheusClient = require("prom-client");

Feature("Logging", () => {
  before(() => {
    transport.logs = [];
  });

  Scenario("Logging debug with JSON format", () => {
    const message = "Message";
    const data = {
      meta: {
        createdAt: "2017-09-24-00:00T00:00:00.000Z",
        updatedAt: "2017-09-24-00:00T00:00:00.000Z",
        correlationId: "sample-correlation-id"
      }
    };

    When("doing some JSON logging", () => {
      logger.debug(message, data);
    });

    Then("log output should be JSON", () => {
      const logContent = transport.logs.shift();
      logContent.logLevel.should.equal("debug");
      logContent.metaData.should.deep.equal(data);
      logContent.message.should.equal(message);
      logContent.location.should.be.ok; // eslint-disable-line no-unused-expressions
    });
  });

  Scenario("Logging a too big message JSON format", () => {
    const message = "Message".repeat(9000);
    const data = {
      meta: {
        createdAt: "2017-09-24-00:00T00:00:00.000Z",
        updatedAt: "2017-09-24-00:00T00:00:00.000Z",
        correlationId: "sample-correlation-id"
      }
    };

    When("logging a huge message", () => {
      logger.debug(message, data);
    });

    Then("log output should be trimmed", () => {
      const logContent = transport.logs.shift();
      logContent.metaData.should.deep.equal(data);
      logContent.message.should.equal("too big to log");
    });
  });

  Scenario("Logging should inc metric", () => {
    const message = "Message";

    before(() => {
      prometheusClient.register.resetMetrics();
    });

    When("initializing the logger and doing some string logging", () => {
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

      logger.notice(message);

      logger.info(message);

      logger.debug(message);
    });

    Then("the logCounter metric should be incremented", () => {
      const counterMetric = prometheusClient.register.getSingleMetric("lulogger_logged_total");
      const emergencyCount = counterMetric.hashMap["level:emergency"].value;
      const alertCount = counterMetric.hashMap["level:alert"].value;
      const criticalCount = counterMetric.hashMap["level:critical"].value;
      const errorCount = counterMetric.hashMap["eventName:,level:error"].value;
      const warningCount = counterMetric.hashMap["level:warning"].value;
      const noticeCount = counterMetric.hashMap["level:notice"].value;
      const infoCount = counterMetric.hashMap["level:info"].value;
      const debugCount = counterMetric.hashMap["level:debug"].value;

      emergencyCount.should.eql(1);
      alertCount.should.eql(2);
      criticalCount.should.eql(3);
      errorCount.should.eql(4);
      warningCount.should.eql(5);
      noticeCount.should.eql(1);
      infoCount.should.eql(1);
      debugCount.should.eql(1);
    });
  });

  Scenario("Logging error with routingKey in logObject should inc metric with eventName as label", () => {
    const message = "Message";
    const routingKey = "namespace.event-name.some.cool.key";

    before(() => {
      prometheusClient.register.resetMetrics();
    });

    When("initializing the logger and doing some string logging", () => {
      logger.error(message, {meta: {routingKey}});
    });

    Then("the logCounter metric should be incremented", () => {
      const counterMetric = prometheusClient.register.getSingleMetric("lulogger_logged_total");
      const errorMetric = counterMetric.hashMap["eventName:event-name,level:error"];
      const errorCount = errorMetric.value;
      const errorLabels = errorMetric.labels;
      errorCount.should.eql(1);
      errorLabels.should.eql({level: "error", eventName: "event-name"});
    });
  });
});
