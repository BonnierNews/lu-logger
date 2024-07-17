export default function moveGcpFieldsToRoot(info) {
  for (const key in info.metaData) {
    if (key.startsWith("logging.googleapis.com")) {
      info[key] = info.metaData[key];
      delete info.metaData[key];
    }
  }
  return info;
}
