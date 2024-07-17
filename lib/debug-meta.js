import { AsyncLocalStorage } from "node:async_hooks";

const debugMetaStorage = new AsyncLocalStorage();

/**
 * Generate an Express middleware that will add data from the request to be logged
 * @param {(req) => object} getDebugMetaFromReq A function that takes the
 * request and response objects and returns an object to be added to the debug meta
 */
export function initDebugMetaMiddleware(getDebugMetaFromReq) {
  return (req, res, next) => {
    const debugMeta = getDebugMetaFromReq(req);
    debugMetaStorage.run(debugMeta, () => {
      next();
    });
  };
}

export function debugMetaFormat(info) {
  const metaData = { ...getDebugMeta(), ...info.metaData };
  if (Object.keys(metaData).length === 0) return info;
  return { ...info, metaData };
}

export function getDebugMeta() {
  return debugMetaStorage.getStore() || {};
}

export default { debugMetaFormat, initDebugMetaMiddleware, getDebugMeta };
