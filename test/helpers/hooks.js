import { logger } from "../../index.js";
import { transport, reset } from "./test-transport.js";

before(() => {
  logger.add(transport);
  reset();
});

after(() => {
  logger.remove(transport);
  reset();
});
