"use strict";

const logLevels = -require("../config/levels");
const {logger} = require("../");
const transport = require("./helpers/test-transport");
const should = require("chai").should();

describe("logger", () => {
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
    log.metaData.should.eql({some: "info"});
  });

  it("should log splat multiple arguments with meta", () => {
    logger.info("one", "two", "three", "four", {some: "info"});
    const log = transport.logs.shift();
    log.should.include({level: "info", message: "one two three four"});
    log.metaData.should.eql({some: "info"});
  });

  it("should log splat multiple arguments without meta", () => {
    logger.info("one", "two", "three", "four");
    const log = transport.logs.shift();
    log.should.include({level: "info", message: "one two three four"});
    log.metaData.should.eql({});
  });

  it("should log splat multiple objects with meta", () => {
    logger.info(
      "one",
      "two",
      {three: 3, four: 4},
      {correlationId: "coobar"}
    );
    const log = transport.logs.shift();
    log.should.include({
      level: "info",
      message: "one two { three: 3, four: 4 }"
    });
    log.metaData.should.eql({correlationId: "coobar"});
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
});
