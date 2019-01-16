"use strict";

const {logger} = require("../");
const transport = require("./helpers/test-transport");
logger.add(transport);

describe("logger", () => {
  it("should log", () => {
    logger.info("foobar");
    const log = transport.logs.shift();
    log.should.eql({level: "info", message: "foobar", meta: {}});
  });

  it("should log with meta", () => {
    logger.info("some message", {"some": "info"});
    const log = transport.logs.shift();
    log.should.eql({level: "info", message: "some message", meta: { "some": "info"}});
  });

  it("should log splat multiple arguments with meta", () => {
    logger.info("one", "two", "three", "four", {"some": "info"});
    const log = transport.logs.shift();
    log.should.eql({level: "info", message: "one two three four", meta: { "some": "info"}});
  });

  it("should log splat multiple arguments without meta", () => {
    logger.info("one", "two", "three", "four");
    const log = transport.logs.shift();
    log.should.eql({level: "info", message: "one two three four", meta: {}});
  });

  it("should log splat multiple objects with meta", () => {
    logger.info("one", "two", {three: 3, four: 4}, {"correlationId": "coobar"});
    const log = transport.logs.shift();
    log.should.eql({level: "info", message: "one two { three: 3, four: 4 }", meta: {correlationId: "coobar"}});
  });
});
