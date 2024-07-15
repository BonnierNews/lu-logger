import { format } from "util";
import config from "exp-config";

export default function stringify(...args) {
  const message = format(...args);
  if (!config?.logging?.pretty) {
    return message.replace(/\n\s*/gm, " ");
  }
  return message;
}
