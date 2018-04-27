"use strict";

const logger = require("../");
const transport = require("./helpers/test-transport");

describe("logger", () => {
  it("should log", () => {
    logger.info("foobar");
    const log = transport.logs.shift();
    log.should.eql({level: "info", message: "foobar", meta: {}});
  });

  it("should log objects", () => {
    logger.info("some message", {"some": "info"});
    const log = transport.logs.shift();
    log.should.eql({level: "info", message: "some message", meta: { "some": "info"}});
  });

  it("should log objects anything", () => {
    logger.info("one", "two", "threee", "four");
    const log = transport.logs.shift();
    log.should.eql({level: "info", message: "some message", meta: { "some": "info"}});
  });

});
