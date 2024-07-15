"use strict";

const logLevels = -require("../config/levels");
const transport = require("./helpers/test-transport");
const should = require("chai").should();
const proxyquire = require("proxyquire").noPreserveCache();

describe("logger", () => {
  const { logger } = proxyquire("../", {});
  logger.add(transport);

  before(() => {
    transport.logs = [];
  });

  it("should log", () => {
    logger.info("foobar");
    const log = transport.logs.shift();
    log.should.include({ level: "info", message: "foobar" });
    log.metaData.should.eql({});
  });

  it("should log with meta", () => {
    logger.info("some message", { some: "info" });
    const log = transport.logs.shift();
    log.should.include({ level: "info", message: "some message" });
    log.metaData.should.eql({ meta: { some: "info" } });
  });

  describe("levels", () => {
    Object.keys(logLevels).forEach((level) => {
      it(`should log ${level}`, () => {
        logger.log(level, "message");
        const log = transport.logs.shift();
        should.exist(log);
        log.level.should.eql(level);
      });
    });
    describe("logLevel aliases", () => {
      it("should mark critical with crit", () => {
        logger.critical("foobar");
        const log = transport.logs.shift();
        log.logLevel.should.eql("crit");
      });

      it("should keep levels when no alias", () => {
        logger.warning("foobar");
        const log = transport.logs.shift();
        log.logLevel.should.eql("warning");
      });
    });
  });

  describe("metaData", () => {
    it("should let metaDatas key be meta", () => {
      const data = {
        meta: {
          createdAt: "2017-09-24-00:00T00:00:00.000Z",
          updatedAt: "2017-09-24-00:00T00:00:00.000Z",
          correlationId: "sample-correlation-id",
        },
      };
      logger.info("message", data);
      const log = transport.logs.shift();
      log.metaData.should.eql(data);
    });

    it("should wrap metaData in meta in not the case", () => {
      const data = {
        createdAt: "2017-09-24-00:00T00:00:00.000Z",
        updatedAt: "2017-09-24-00:00T00:00:00.000Z",
        correlationId: "sample-correlation-id",
      };
      logger.info("message", data);
      const log = transport.logs.shift();
      log.metaData.should.eql({ meta: data });
    });
  });

  describe("location", () => {
    it("should log location", () => {
      logger.info("message");
      const log = transport.logs.shift();
      log.location.should.include("test/logger-test.js");
    });
  });
});
