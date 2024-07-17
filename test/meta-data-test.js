import { getLastLogAsJson } from "./helpers/test-transport.js";
import { initDebugMetaMiddleware } from "../lib/debug-meta.js";
import { logger } from "../index.js";

describe("logging messages with default metaData", () => {
  const data = {
    meta: {
      correlationId: "sample-correlation-id",
      eventName: "someEvent",
    },
  };

  it("should log a message with metaData", () => {
    logger.info("some message", data);
    const log = getLastLogAsJson();
    log.message.should.eql("some message");
    log.metaData.should.eql(data);
  });

  it("should not log metaData if not given", () => {
    logger.info("some message");
    const log = getLastLogAsJson();
    log.message.should.eql("some message");
    log.metaData.should.eql({});
  });

  it("should get correct location", () => {
    logger.info("some message");
    const log = getLastLogAsJson();
    log.message.should.eql("some message");
    log.location.should.include("test/meta-data-test.js");
  });

  it("should log data from debugMetaMiddleware automatically", () => {
    const middleware = initDebugMetaMiddleware((req) => req.debugMeta);

    middleware({ debugMeta: { foo: "bar" } }, {}, () => {
      logger.info("some message");
    });
    const log = getLastLogAsJson();
    log.message.should.eql("some message");
    log.metaData.should.eql({ foo: "bar" });
  });

  it("should merge data from debugMetaMiddleware and passed metadata", () => {
    const middleware = initDebugMetaMiddleware((req) => req.debugMeta);

    middleware({ debugMeta: { foo: "bar" } }, {}, () => {
      logger.info("some message", { bar: "baz" });
    });
    const log = getLastLogAsJson();
    log.message.should.eql("some message");
    log.metaData.should.eql({ foo: "bar", bar: "baz" });
  });
});
