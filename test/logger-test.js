import { levels as logLevels } from "../config/levels.js";
import { getLastLogAsJson } from "./helpers/test-transport.js";
import { logger } from "../index.js";

describe("logger", () => {
  it("should log", () => {
    logger.info("foobar");
    const log = getLastLogAsJson();
    log.should.include({ level: "info", message: "foobar" });
    log.metaData.should.eql({});
  });

  it("should log with metadata", () => {
    logger.info("some message", { some: "info" });
    const log = getLastLogAsJson();
    log.should.include({ level: "info", message: "some message" });
    log.metaData.should.eql({ some: "info" });
  });

  describe("levels", () => {
    Object.keys(logLevels).forEach((level) => {
      it(`should log ${level}`, () => {
        logger.log(level, "message");
        const log = getLastLogAsJson();
        log.level.should.eql(level);
      });
    });
    describe("logLevel aliases", () => {
      it("should mark critical with crit", () => {
        logger.critical("foobar");
        const log = getLastLogAsJson();
        log.logLevel.should.eql("crit");
      });

      it("should keep levels when no alias", () => {
        logger.warning("foobar");
        const log = getLastLogAsJson();
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
      const log = getLastLogAsJson();
      log.metaData.should.eql(data);
    });

    it("should wrap metaData in meta in not the case", () => {
      const data = {
        createdAt: "2017-09-24-00:00T00:00:00.000Z",
        updatedAt: "2017-09-24-00:00T00:00:00.000Z",
        correlationId: "sample-correlation-id",
      };
      logger.info("message", data);
      const log = getLastLogAsJson();
      log.metaData.should.eql(data);
    });
  });

  describe("location", () => {
    it("should log location", () => {
      logger.info("message");
      const log = getLastLogAsJson();
      log.location.should.include("test/logger-test.js");
    });
  });
});
