import config from "exp-config";

export default function cleanEntry(info) {
  const noapikey =
    /([\\"]{0,}(x-)?(api-key|apiKey[a-zA-Z]*)[\\"]{0,}[:=][\\"]{0,})(([\s]?[\\"]?[0-9a-fA-F]){8}-([0-9a-fA-F]{4}-){3}[0-9a-fA-F]{12})([\\"]{0,})/gi;
  const noAuth = /([\\"]+)auth([\\"]+:)({|\n)([^}]*})/gi;
  const noToken = /(token[s]?[/\\":]+)[a-z0-9-]{36}([/ \\",}]+)/gi;
  const noBasicAuth = /(:\/\/[a-z0-9äöå])[^"{}@ ]+?:[^"{}@ ]+?@/gi;
  const maskEmail = /([\\"]+[a-zäöå])[^"{}@ ]+?@([a-zäöå0-9.]+?[\\"]+)/gi;
  const maskName = /([\\"]+(firstName|lastName)[\\"]+:)([\\"]+[a-zäöå])[^"{}]+?([\\"]+)/gi;
  const password = /([\\"]+password[\\"]?:\s?[\\"]?)([^\s\\"]+)(.*)/gi;
  const secret = /([\\"]+\S+secret[\\"]?:\s?[\\"]?)([^\s\\"]+)(.*)/gi;
  const accessToken = /([\\"]+access_token[\\"]?:\s?[\\"]?)([^\s\\"]+)(.*)/gi;

  info.message = info.message
    .replace(noapikey, "$1SECRET$7")
    .replace(noAuth, "$1auth$2$1SECRET$1")
    .replace(noBasicAuth, "$1xxx:SECRET@")
    .replace(noToken, "$1SECRET$2")
    .replace(maskEmail, "$1xxx@$2")
    .replace(maskName, "$1$3xxx$4")
    .replace(password, "$1SECRET$3")
    .replace(secret, "$1SECRET$3")
    .replace(accessToken, "$1SECRET$3");

  if (!config?.logging?.pretty) {
    info.message = info.message.replace(/\n\s*/gm, " ");
  }

  return info;
}
