"use strict";

const transport = require("./helpers/test-transport");

const proxyquire = require("proxyquire").noPreserveCache();

describe("logging messages with default metaData", () => {
  const {logger: winston} = proxyquire("../", {});
  winston.add(transport);

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
    const logger = winston.child(data);
    logger.info("some message");
    const log = transport.logs.shift();
    log.message.should.eql("some message");
    log.metaData.should.eql(data);
  });

  it("should log a message with metaData and splat", () => {
    const logger = winston.child(data);
    logger.info("some message", "one", {true: false});
    const log = transport.logs.shift();
    log.message.should.eql("some message one { true: false }");
    log.metaData.should.eql(data);
  });

  it("should log a stringformatted with metaData and splat", () => {
    const logger = winston.child(data);
    const routingKey = "key";
    const listener = "listenerFn";
    const message = {
      id: "someid",
      type: "message-type"
    };
    logger.info(`routingKey: ${routingKey}, listener ${listener}, message %j`, message);
    const log = transport.logs.shift();
    log.message.should.eql('routingKey: key, listener listenerFn, message {"id":"someid","type":"message-type"}');
    log.metaData.should.eql(data);
  });

  it("should not log metaData if not given", () => {
    const logger = winston.child();
    logger.info("some message");
    const log = transport.logs.shift();
    log.message.should.eql("some message");
    log.metaData.should.eql({});
  });

  it("should get correct location", () => {
    const logger = winston.child(data);
    logger.info("some message", "one", {true: false});
    const log = transport.logs.shift();
    log.message.should.eql("some message one { true: false }");
    log.location.should.include("test/meta-data-test.js");
  });
});
