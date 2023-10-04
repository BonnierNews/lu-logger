"use strict";

const { AsyncLocalStorage } = require("node:async_hooks");

const debugMetaStorage = new AsyncLocalStorage();

/**
 * Generate an Express middleware that will add data from the request to be logged
 * @param {(req) => object} getDebugMetaFromReq A function that takes the
 * request and response objects and returns an object to be added to the debug meta
 */
function initDebugMetaMiddleware(getDebugMetaFromReq) {
  return (req, res, next) => {
    const debugMeta = getDebugMetaFromReq(req);
    debugMetaStorage.run(debugMeta, () => {
      next();
    });
  };
}

function debugMetaFormat(info) {
  const debugMeta = { ...getDebugMeta(), ...info.metaData?.meta };
  if (Object.keys(debugMeta).length === 0) return info;
  return {
    ...info,
    metaData: { meta: { ...getDebugMeta(), ...info.metaData?.meta } },
  };
}

function getDebugMeta() {
  return debugMetaStorage.getStore() || {};
}

module.exports = {
  initDebugMetaMiddleware,
  debugMetaFormat,
  getDebugMeta,
};
