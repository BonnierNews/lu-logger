"use strict";

function getEventName(logObject) {
  const routingKey = logObject && logObject.meta ? logObject.meta.routingKey : "";
  return routingKey && (routingKey.match(/\./g) || []).length > 1 ? routingKey.split(".")[1] : "";
}

module.exports = getEventName;
