"use strict";

const transport = require("../helpers/test-transport");
const prometheusClient = require("prom-client");
const proxyquire = require("proxyquire").noPreserveCache();

const basePkg = require("../../package.json");
const nock = require("nock");

Feature("Logging", () => {
  const mockedPkg = Object.assign({}, basePkg);

  afterEachScenario(nock.cleanAll);

  const {logger} = proxyquire("../..", {
    "./lib/prom-transport": proxyquire("../../lib/prom-transport", {
      [`${process.cwd()}/package.json`]: mockedPkg
    })
  });
  logger.add(transport);

  before(() => {
    transport.logs = [];
  });

  let config;
  beforeEach(() => {
    Object.assign(mockedPkg, basePkg);
    config = require("exp-config");
  });

  afterEach(() => {
    config = require("exp-config");
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

  Scenario("Logging a too big message JSON format, default behaviour (in config)", () => {
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

    Then("log output should be a message that it is too big to log", () => {
      const logContent = transport.logs.shift();
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
        correlationId: "sample-correlation-id"
      }
    };

    Given("we have no config for handling big logs", () => {
      delete config.handleBigLogs;
    });

    When("logging a huge message", () => {
      logger.debug(message, data);
    });

    Then("log output should be a message that it is too big to log", () => {
      const logContent = transport.logs.shift();
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
        correlationId: "sample-correlation-id"
      }
    };

    Given("we want to truncate big logs", () => {
      config.handleBigLogs = "truncate";
    });

    When("logging a huge message", () => {
      logger.debug(message, data);
    });

    Then("log output should be the first 60 * 1024 bytes of the message", () => {
      const logContent = transport.logs.shift();
      logContent.metaData.should.deep.equal(data);
      logContent.message.should.equal(`${message.substring(0, 60 * 1024 - 3)}...`);
    });
  });

  Scenario("Logging an api-key", () => {
    const message = "Message";
    const data = "x-api-key:8a1ba457-24bc-4941-b136-d401a717c223";

    When("logging a huge message", () => {
      logger.debug(message, data);
    });

    Then("log output should be trimmed", () => {
      const logContent = transport.logs.shift();
      logContent.message.should.equal("Message x-api-key:SECRET");
    });
  });

  Scenario("Logging an api-key as message", () => {
    const message = "x-api-key:8a1ba457-24bc-4941-b136-d401a717c223";
    const data = "some-data";

    When("logging a message with an API Key", () => {
      logger.debug(message, data);
    });

    Then("log output should be trimmed", () => {
      const logContent = transport.logs.shift();
      logContent.message.should.equal("x-api-key:SECRET some-data");
    });
  });

  Scenario("Logging a message including basic auth", () => {
    const message = "amqp://user:password@example.com/some-path";
    const data = "some-data";

    When("logging a message with an API Key", () => {
      logger.debug(message, data);
    });

    Then("log output should be trimmed", () => {
      const logContent = transport.logs.shift();
      logContent.message.should.equal("amqp://uxxx:SECRET@example.com/some-path some-data");
    });
  });

  Scenario("Logging an auth object as message", () => {
    const message =
      '{"auth":{"user":"some-user","pass":"some-password"},"correlationId":"e91c70da-5156-1234-5678-451e863c1639"}';
    const data = "some-data";

    When("logging a message with an auth string", () => {
      logger.debug(message, data);
    });

    Then("log output should be trimmed", () => {
      const logContent = transport.logs.shift();
      logContent.message.should.equal(
        '{"auth":"SECRET","correlationId":"e91c70da-5156-1234-5678-451e863c1639"} some-data'
      );
    });
  });

  Scenario("Logging an auth object as message, with escaped quotes", () => {
    const message =
      '{\\"auth\\":{\\"user\\":\\"some-user\\",\\"pass\\":\\"some-password\\"},\\"correlationId\\":\\"e91c70da-5156-1234-5678-451e863c1639\\"}';
    const data = "some-data";

    When("logging a message with an auth string", () => {
      logger.debug(message, data);
    });

    Then("log output should be trimmed", () => {
      const logContent = transport.logs.shift();
      logContent.message.should.equal(
        '{\\"auth\\":\\"SECRET\\",\\"correlationId\\":\\"e91c70da-5156-1234-5678-451e863c1639\\"} some-data'
      );
    });
  });

  Scenario("Logging an api-key as message, with quotes around the api key, no data", () => {
    const message = '"x-api-key":"8a1ba457-24bc-4941-b136-d401a717c223"';

    When("logging a message with an x-api-key", () => {
      logger.debug(message);
    });

    Then("log output should be trimmed", () => {
      const logContent = transport.logs.shift();
      logContent.message.should.equal('"x-api-key":"SECRET"');
    });
  });

  Scenario("Stripping email and names from log, no data", () => {
    const message =
      '{"offerCode":"some-offer","email":"some.email@example.com","firstName":"Joe","lastName":"Bloggs","correlationId":"e91c70da-5156-1234-5678-451e863c1639"}';

    When("logging a message with an email and first and last names", () => {
      logger.debug(message);
    });

    Then("log output should be trimmed", () => {
      const logContent = transport.logs.shift();
      logContent.message.should.equal(
        '{"offerCode":"some-offer","email":"sxxx@example.com","firstName":"Jxxx","lastName":"Bxxx","correlationId":"e91c70da-5156-1234-5678-451e863c1639"}'
      );
    });
  });

  Scenario("Strip token from log", () => {
    const message =
      "/_api/v2/expressen/token/d589b307-a109-4fd1-b621-cc4d5d8f1f32/ {token:d589b307-a109-4fd1-b621-cc4d5d8f1f32}";
    const data = '{"token":"d589b307-a109-4fd1-b621-cc4d5d8f1f32"}';

    When("logging a message with some tokens in it", () => {
      logger.debug(message, data);
    });

    Then("log output should be trimmed", () => {
      const logContent = transport.logs.shift();
      logContent.message.should.equal('/_api/v2/expressen/token/SECRET/ {token:SECRET} {"token":"SECRET"}');
    });
  });

  Scenario("Strip token from log, calling an endpoint", () => {
    const message = `HTTP GET, https://example.com/customer-token/v1/tokens/d589b307-a109-4fd1-b621-cc4d5d8f1f32, params: {"something": "param"}`;

    When("logging a message with a URL containing tokens", () => {
      logger.debug(message);
    });

    Then("log output should be trimmed", () => {
      const logContent = transport.logs.shift();
      logContent.message.should.equal(
        'HTTP GET, https://example.com/customer-token/v1/tokens/SECRET, params: {"something": "param"}'
      );
    });
  });

  Scenario("Should support prefixed package names", () => {
    let newLogger;

    When("loading the logger in a prefixed package", () => {
      mockedPkg.name = "@bonniernews/example";
      newLogger = proxyquire("../..", {
        "./lib/prom-transport": proxyquire("../../lib/prom-transport", {
          [`${process.cwd()}/package.json`]: mockedPkg
        })
      }).logger;
      newLogger.add(transport);
    });

    Then("should have a valid metric registered", () => {
      // eslint-disable-next-line no-undef
      should.exist(prometheusClient.register.getSingleMetric("example_logged_total"));
    });
  });

  Scenario("Logging should inc metric", () => {
    const message = "Message";

    before(() => {
      prometheusClient.register.resetMetrics();
    });

    Given("Datadog is ready to receive our requests for logging", () => {
      const serviceName = "lu-logger";
      const ddSource = "nodejs";
      const ddTags = encodeURIComponent("bn-department:bn-data,bn-env:non-prod,bn-env-specific:test,bn-app:lu-logger");
      nock("https://http-intake.logs.datadoghq.eu")
        .post(`/v1/input/some-api-key?service=${serviceName}&ddsource=${ddSource}&ddtags=${ddTags}`)
        .times(25)
        .reply(204);
    });

    When("initializing the logger and doing some string logging", () => {
      logger.error(message);

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
      const alertCount = counterMetric.hashMap["level:alert"].value;
      const criticalCount = counterMetric.hashMap["level:critical"].value;
      const errorCount = counterMetric.hashMap["eventName:,level:error"].value;
      const warningCount = counterMetric.hashMap["level:warning"].value;
      const noticeCount = counterMetric.hashMap["level:notice"].value;
      const infoCount = counterMetric.hashMap["level:info"].value;
      const debugCount = counterMetric.hashMap["level:debug"].value;

      alertCount.should.eql(2);
      criticalCount.should.eql(3);
      errorCount.should.eql(5);
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

    Given("Datadog is ready to receive our requests for logging", () => {
      const serviceName = "lu-logger";
      const ddSource = "nodejs";
      const ddTags = encodeURIComponent("bn-department:bn-data,bn-env:non-prod,bn-env-specific:test,bn-app:lu-logger");
      nock("https://http-intake.logs.datadoghq.eu")
        .post(`/v1/input/some-api-key?service=${serviceName}&ddsource=${ddSource}&ddtags=${ddTags}`)
        .reply(204);
    });

    When("initializing the logger and doing some string logging", () => {
      logger.error(message, {meta: {routingKey}});
    });

    Then("the logCounter metric for eventName should be incremented", () => {
      const counterMetric = prometheusClient.register.getSingleMetric("lulogger_logged_total");
      const errorMetric = counterMetric.hashMap["eventName:event-name,level:error"];
      const errorCount = errorMetric.value;
      const errorLabels = errorMetric.labels;
      errorCount.should.eql(1);
      errorLabels.should.eql({level: "error", eventName: "event-name"});
    });
  });
});
