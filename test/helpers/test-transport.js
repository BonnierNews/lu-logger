import { Writable } from "stream";
import { transports } from "winston";

let output = "";
const stream = new Writable();
stream._write = (chunk, encoding, next) => {
  output = output += chunk.toString();
  next();
};

export const transport = new transports.Stream({ stream });

export function getAllLogs() {
  return output.trim().split("\n");
}

export function getLastLog() {
  return getAllLogs().pop();
}

export function getLastLogAsJson() {
  return JSON.parse(getLastLog());
}

export function reset() {
  output = "";
}
