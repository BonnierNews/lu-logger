import { format } from "util";
import config from "exp-config";

/* c8 ignore start */
export default function stringify(...args) {
  const message = format(...args);
  if (!config?.logging?.pretty) {
    return message.replace(/\n\s*/gm, " ");
  }
  return message;
}
/* c8 ignore stop */
