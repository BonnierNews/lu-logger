// "use strict";

// const path = require("path");
// const fs = require("fs");
// const createLogger = require("../lib/logger");
// const fileName = path.join(__dirname, "..", "logs", "test.log");
// const logger = createLogger({
//   log: "file",
//   logLevel: "debug",
//   logJson: true,
//   truncateLog: true
// });

// describe("logging a message", () => {
//   const data = {
//     "meta": {
//       "createdAt": "2017-09-24-00:00T00:00:00.000Z",
//       "updatedAt": "2017-09-24-00:00T00:00:00.000Z",
//       "correlationId": "sample-correlation-id"
//     }
//   };

//   const log = [];

//   before(() => {
//     logger.winstone.on("logged", (args) => {
//       console.log("logged", args);
//     });

//     logger(data).debug("some message");
//     logger.info("some message", data);
//     logger.info("some message");
//     logger("sample-correlation-id").info("some message");
//     log.push(...readLog());
//   });

//   it("should log a message with metaData", () => {
//     log[log.length - 4].message.should.eql("some message");
//     log[log.length - 4].metaData.shoud.eql(data);
//   });

//   it("should log a message", () => {
//     log[log.length - 3].message.should.eql("some message");
//     log[log.length - 3].metaData.shoud.eql(data);
//   });

//   it("should not log meta if not given", () => {
//     log[log.length - 2].message.should.eql("some message");
//     log[log.length - 2].metaData.should.eql({});
//   });

//   it("should log correlationId if given as first argument", () => {
//     log[log.length - 1].message.should.eql("some message");
//     log[log.length - 1].metaData.meta.correlationId.should.eql("sample-correlation-id");
//   });
// });

// function readLog() {
//   return fs.readFileSync(fileName, {"encoding": "utf-8"})
//     .trim()
//     .split("\n")
//     .map(JSON.parse);
// }
