"use strict";

const logLevels = -require("../config/levels");
const transport = require("./helpers/test-transport");
const should = require("chai").should();
const proxyquire = require("proxyquire").noPreserveCache();

describe("logger", () => {
  const {logger} = proxyquire("../", {});
  logger.add(transport);

  before(() => {
    transport.logs = [];
  });

  it("should log", () => {
    logger.info("foobar");
    const log = transport.logs.shift();
    log.should.include({level: "info", message: "foobar"});
    log.metaData.should.eql({});
  });

  it("should log with meta", () => {
    logger.info("some message", {some: "info"});
    const log = transport.logs.shift();
    log.should.include({level: "info", message: "some message"});
    log.metaData.should.eql({meta: {some: "info"}});
  });

  it("should log splat multiple arguments with meta", () => {
    logger.info("one", "two", "three", "four", {some: "info"});
    const log = transport.logs.shift();
    log.should.include({level: "info", message: "one two three four"});
    log.metaData.should.eql({meta: {some: "info"}});
  });

  it("should log splat multiple arguments without meta", () => {
    logger.info("one", "two", "three", "four");
    const log = transport.logs.shift();
    log.should.include({level: "info", message: "one two three four"});
    log.metaData.should.eql({});
  });

  it("should log splat multiple objects with meta", () => {
    logger.info("one", "two", {three: 3, four: 4}, {correlationId: "coobar"});
    const log = transport.logs.shift();
    log.should.include({
      level: "info",
      message: "one two { three: 3, four: 4 }"
    });
    log.metaData.should.eql({meta: {correlationId: "coobar"}});
  });

  it("should splat stringformatted messages when metadata", () => {
    const data = {
      meta: {
        correlationId: "someCorrelationId"
      }
    };
    const routingKey = "key";
    const listener = "listenerFn";
    const message = {
      id: "someid",
      type: "message-type"
    };
    logger.info(`routingKey: ${routingKey}, listener ${listener}, message %j`, message, data);
    const log = transport.logs.shift();
    log.message.should.eql('routingKey: key, listener listenerFn, message {"id":"someid","type":"message-type"}');
    log.metaData.should.eql(data);
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
      it("should mark emergency with emerg", () => {
        logger.emergency("foobar");
        const log = transport.logs.shift();
        log.logLevel.should.eql("emerg");
      });

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
          correlationId: "sample-correlation-id"
        }
      };
      logger.info("message", data);
      const log = transport.logs.shift();
      log.metaData.should.eql(data);
    });

    it("should wrap metaData in meta in not the case", () => {
      const data = {
        createdAt: "2017-09-24-00:00T00:00:00.000Z",
        updatedAt: "2017-09-24-00:00T00:00:00.000Z",
        correlationId: "sample-correlation-id"
      };
      logger.info("message", data);
      const log = transport.logs.shift();
      log.metaData.should.eql({meta: data});
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
