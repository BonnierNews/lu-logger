/**
 * Code borrowed from https://github.com/itsfadnis/datadog-winston
 *
 * That repository isn't updated very often these days, not even with
 * security patches.
 *
 * Minor changes made to the code in order for it to suit this repo.
 */

"use strict";

const nock = require("nock");
const Transport = require("winston-transport");
const should = require("chai").should();

const DatadogTransport = require("../../lib/datadog-transport");

describe("Datadog transport", () => {
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
            "/v1/input/apikey",
            JSON.stringify({
              dd: {
                trace_id: "abc", // eslint-disable-line camelcase
                span_id: "def" // eslint-disable-line camelcase
              },
              foo: "bar"
            })
          )
          .query({
            service: "service",
            ddsource: "ddsource",
            ddtags: "env:production,trace_id:abc,span_id:def,tag_a:value_a,tag_b:value_b",
            hostname: "hostname"
          })
          .reply(204);

        const opts = Object.assign(
          {},
          {
            apiKey: "apikey",
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

        await transport.log(
          {
            dd: {
              trace_id: "abc", // eslint-disable-line camelcase
              span_id: "def" // eslint-disable-line camelcase
            },
            foo: "bar",
            ddtags: "tag_a:value_a,tag_b:value_b"
          },
          callback
        );
        should.equal(hasBeenCalled, true);
        should.equal(scope.isDone(), true);
      });
    });
  });
});
