import "mocha-cakes-2";

import chai from "chai";

process.env.NODE_ENV = "test";

chai.config.truncateThreshold = 0;
chai.config.includeStack = true;

Object.assign(global, { should: chai.should() });
