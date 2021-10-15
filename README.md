# lu-logger

## Purpose and features
File name and line number of the log caller is also added when logging in debug level.

## Configuration
A configuration object must be passed to the constructor when initiating the logger.


### Example
```js
const logger = require("lu-logger")({
  "log": "stdout",      // Or file, required
  "logLevel": "debug",  // Minimum level to log
  "logJson": true       // Log JSON objects or string messages, defaults to true
});
```
### Metrics
All log events will also increment a counter `<metricPrefix>_logged_total` with the level as label.
The `metricPrefix` will be automatically resolved from the calling applications `name` in package.json.
If there is no `name` in package.json the `metricPrefix` will be `undefined`;


Example of metrics produced:

```
# HELP orderapi_logged_total Counts number of logs with loglevel as label
# TYPE orderapi_logged_total counter
orderapi_logged_total{level="info"} 28
orderapi_logged_total{level="error"} 39
orderapi_logged_total{level="debug"} 2
```


### Log output mode
When log mode `file` is enabled, the log will be written to a file at `<app root>/logs/<NODE_ENV>.log` directory, where `app root` is the folder containing the `package.json` file.
Log mode `stdout` will log to stdout.

## Example
### JSON object in the log
The JSON below is an example of a log entry when `logJson` is set to true (or omitted) and `logLevel` is set to debug.
```json
{
  "data": {
    "meta": "meta-data"
  },
  "greenFieldLogMeta": {
    "location": "lib/logging-producer.js:38",
    "correlationId": "sample-correlation-id"
  },
  "level": "debug",
  "message": "This is the log message",
  "timestamp": "2018-02-21T12:22:19.150Z"
}
```
