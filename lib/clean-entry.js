"use strict";
const config = require("exp-config").logging;

function cleanEntry(info) {
  const noapikey =
    /([\\"]{0,}(x-)?api-key[\\"]{0,}[:=][\\"]{0,})(([\s]?[\\"]?[0-9a-fA-F]){8}-([0-9a-fA-F]{4}-){3}[0-9a-fA-F]{12})([\\"]{0,})/gi;
  const noAuth = /([\\"]+)auth([\\"]+:)({|\n)([^}]*})/gi;
  const noToken = /(token[s]?[/\\":]+)[a-z0-9-]{36}([/ \\",}]+)/gi;
  const noBasicAuth = /(:\/\/[a-z0-9äöå]).+?:.+?@/gi;
  const maskEmail = /([\\"]+[a-zäöå])[^"{}@]+?@([a-zäöå0-9.]+?[\\"]+)/gi;
  const maskName = /([\\"]+(firstName|lastName)[\\"]+:)([\\"]+[a-zäöå])[^"{}]+?([\\"]+)/gi;

  info.message = info.message
    .replace(noapikey, "$1SECRET$6")
    .replace(noAuth, "$1auth$2$1SECRET$1")
    .replace(noBasicAuth, "$1xxx:SECRET@")
    .replace(noToken, "$1SECRET$2")
    .replace(maskEmail, "$1xxx@$2")
    .replace(maskName, "$1$3xxx$4");

  if (!config.pretty) {
    info.message = info.message.replace(/\n\s*/gm, " ");
  }

  return info;
}

module.exports = cleanEntry;
