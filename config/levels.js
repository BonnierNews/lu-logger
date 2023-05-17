"use strict";

const levels = {
  alert: 1,
  critical: 2,
  error: 3,
  warning: 4,
  notice: 5,
  info: 6,
  debug: 7
};
const aliases = {
  critical: "crit"
};

const colors = {
  alert: "darkred",
  critical: "cyan",
  error: "red",
  warning: "yellow",
  notice: "magenta",
  info: "green",
  debug: "gray"
};

module.exports = {
  levels,
  aliases,
  colors
};
