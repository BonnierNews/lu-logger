"use strict";

const getEventName = require("../../lib/get-event-name");

describe("getting event name from routing key", () => {
  it("should return empty string if logObj is undefined", () => {
    getEventName(undefined).should.eql("");
  });
  it("should return empty string if logObj does not have meta", () => {
    getEventName({}).should.eql("");
  });
  it("should return empty string if logObj.meta does not have routingKey", () => {
    getEventName({ meta: {} }).should.eql("");
  });
  it("should return empty string if routing key is empty", () => {
    getEventName(createLogObj("")).should.eql("");
  });
  it("should return empty string if routing key is undefined", () => {
    getEventName(createLogObj(undefined)).should.eql("");
  });
  it("should return empty string if routing key is null", () => {
    getEventName(createLogObj(null)).should.eql("");
  });
  it("should return empty string if routing key is not in the format we expect", () => {
    getEventName(createLogObj("routingkeywithoutdots")).should.eql("");
    getEventName(createLogObj("routingkeywith.onedot")).should.eql("");
  });
  it("should return correct event name for routing key with format namespace.event-name.some.cool.key", () => {
    getEventName(createLogObj("namespace.event-name.some.cool.key")).should.eql("event-name");
    getEventName(createLogObj("namespace.event-name.some.cool")).should.eql("event-name");
    getEventName(createLogObj("namespace.event-name.some")).should.eql("event-name");
  });
});

function createLogObj(routingKey) {
  return { meta: { routingKey } };
}
