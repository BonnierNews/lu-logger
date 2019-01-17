"use strict";

const {buildLogger} = require("../");
const transport = require("./helpers/test-transport");

describe("logging messages with default metaData", () => {
  const data = {
    meta: {
      correlationId: "sample-correlation-id",
      eventName: "someEvent"
    }
  };
  before(() => {
    transport.logs = [];
  });

  it("should log a message with metaData", () => {
    const logger = buildLogger(data);
    logger.add(transport);
    logger.info("some message");
    const log = transport.logs.shift();
    log.message.should.eql("some message");
    log.metaData.should.eql(data);
  });

  it("should log a message with metaData and splat", () => {
    const logger = buildLogger(data);
    logger.add(transport);
    logger.info("some message", "one", {true: false});
    const log = transport.logs.shift();
    log.message.should.eql("some message one { true: false }");
    log.metaData.should.eql(data);
  });

  it("should not log metaData if not given", () => {
    const logger = buildLogger();
    logger.add(transport);
    logger.info("some message");
    const log = transport.logs.shift();
    log.message.should.eql("some message");
    log.metaData.should.eql({});
  });

  it("should get correct location", () => {
    const logger = buildLogger(data);
    logger.add(transport);
    logger.info("some message", "one", {true: false});
    const log = transport.logs.shift();
    log.message.should.eql("some message one { true: false }");
    log.location.should.eql("test/meta-data-test.js:47");
  });
});
