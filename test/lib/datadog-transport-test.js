/**
 * Code borrowed from https://github.com/itsfadnis/datadog-winston
 *
 * That repository isn't updated very often these days, not even with
 * security patches.
 *
 * Minor changes made to the code in order for it to suit this repo.
 */

"use strict";

const config = require("exp-config");
const nock = require("nock");
const Transport = require("winston-transport");
const should = require("chai").should();

const DatadogTransport = require("../../lib/datadog-transport");

describe("Datadog transport", () => {
  const info = {
    dd: {
      trace_id: "abc", // eslint-disable-line camelcase
      span_id: "def" // eslint-disable-line camelcase
    },
    foo: "bar",
    ddtags: "tag_a:value_a,tag_b:value_b"
  };

  const query = {
    service: "service",
    ddsource: "ddsource",
    ddtags: "env:production,trace_id:abc,span_id:def,tag_a:value_a,tag_b:value_b",
    hostname: "hostname"
  };

  afterEachScenario(nock.cleanAll);

  describe("setup", () => {
    it("extends Winston transport", () => {
      should.equal(DatadogTransport.prototype instanceof Transport, true);
    });

    it("throws an error if api key isn't passed in", () => {
      try {
        // eslint-disable-next-line
        new DatadogTransport();
      } catch (e) {
        e.message.should.equal("Missing required option: `apiKey`");
      }
    });

    it("has a name", () => {
      const transport = new DatadogTransport({
        apiKey: "apiKey"
      });
      transport.name.should.equal("datadog");
    });

    describe("different intake regions", () => {
      it("should set correct api URL for EU", () => {
        const opts = {intakeRegion: "eu", apiKey: "afsky"};
        const dt = new DatadogTransport(opts);
        dt.apiUrl().should.equal("https://http-intake.logs.datadoghq.eu/v1/input/afsky");
      });

      it("should set correct api URL for US3", () => {
        const opts = {intakeRegion: "us3", apiKey: "afsky"};
        const dt = new DatadogTransport(opts);
        dt.apiUrl().should.equal("https://http-intake.logs.us3.datadoghq.com/v1/input/afsky");
      });

      it("should set correct api URL for US5", () => {
        const opts = {intakeRegion: "us5", apiKey: "afsky"};
        const dt = new DatadogTransport(opts);
        dt.apiUrl().should.equal("https://http-intake.logs.us5.datadoghq.com/v1/input/afsky");
      });

      it("should set correct api URL for default", () => {
        const opts = {apiKey: "afsky"};
        const dt = new DatadogTransport(opts);
        dt.apiUrl().should.equal("https://http-intake.logs.datadoghq.com/v1/input/afsky");
      });
    });
  });

  describe("DatadogTransport#log(info, callback)", () => {
    let configOld;
    before(() => {
      configOld = config.logging.datadog;
      config.logging.datadog.batchSize = 1;
    });

    after(() => {
      config.logging.datadog = configOld;
    });

    [
      {
        case: "transfers logs to the default intake",
        uri: "https://http-intake.logs.datadoghq.com"
      },
      {
        case: "transfers logs to the EU intake",
        uri: "https://http-intake.logs.datadoghq.eu",
        opts: {
          intakeRegion: "eu"
        }
      }
    ].forEach((testCase) => {
      it(testCase.case, async () => {
        const scope = nock(testCase.uri, {
          reqheaders: {
            "content-type": "application/json"
          }
        })
          .post(
            `/v1/input/${config.logging.datadog.apiKey}`,
            JSON.stringify([
              {
                dd: {
                  trace_id: "abc", // eslint-disable-line camelcase
                  span_id: "def" // eslint-disable-line camelcase
                },
                foo: "bar"
              }
            ])
          )
          .query(query)
          .reply(204);

        const opts = Object.assign(
          {},
          {
            apiKey: config.logging.datadog.apiKey,
            service: "service",
            ddsource: "ddsource",
            ddtags: "env:production",
            hostname: "hostname"
          },
          testCase.opts ? testCase.opts : {}
        );

        const transport = new DatadogTransport(opts);
        let hasBeenCalled = false;
        const callback = () => {
          hasBeenCalled = true;
        };

        await transport.log(info, callback);
        should.equal(hasBeenCalled, true);
        should.equal(scope.isDone(), true);
      });
    });
  });

  describe("DatadogTransport#log(info, callback) in batch", () => {
    let configOld;
    before(() => {
      configOld = config.logging.datadog;
      config.logging.datadog.batchSize = 2;
    });

    after(() => {
      config.logging.datadog = configOld;
    });

    it("transfers logs to the EU intake", async () => {
      nock("https://http-intake.logs.datadoghq.eu", {
        reqheaders: {
          "content-type": "application/json"
        }
      })
        .post(
          `/v1/input/${config.logging.datadog.apiKey}`,
          JSON.stringify([
            {
              dd: {
                trace_id: "abc", // eslint-disable-line camelcase
                span_id: "def" // eslint-disable-line camelcase
              },
              foo: "bar"
            },
            {
              dd: {
                trace_id: "abc", // eslint-disable-line camelcase
                span_id: "def" // eslint-disable-line camelcase
              },
              foo: "bar"
            }
          ])
        )
        .query(query)
        .reply(204);

      const transport = new DatadogTransport({
        apiKey: config.logging.datadog.apiKey,
        service: "service",
        ddsource: "ddsource",
        ddtags: "env:production",
        hostname: "hostname",
        intakeRegion: "eu"
      });

      let hasBeenCalledFirst = false;
      const callbackFirst = () => {
        hasBeenCalledFirst = true;
      };

      await transport.log(info, callbackFirst);
      should.equal(hasBeenCalledFirst, true);

      let hasBeenCalledSecond = false;
      const callbackSecond = () => {
        hasBeenCalledSecond = true;
      };

      await transport.log(info, callbackSecond);
      should.equal(hasBeenCalledSecond, true);
    });
  });
});
