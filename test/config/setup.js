"use strict";

process.env.NODE_ENV = "test";

// Setup common test libraries
require("mocha-cakes-2");

const chai = require("chai");

chai.config.truncateThreshold = 0;
chai.config.includeStack = true;

Object.assign(global, { should: chai.should() });

const { logger } = require("../../.");
logger.add(require("../helpers/test-transport"));
