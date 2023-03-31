////////////////////logger.util/////////////////////////
// this file contains all the logging functions //
// exports:
//  logger: (winston logger object with all the transports)
///////////////////////////////////////////////////

const winston = require("winston");
import { version } from "../version";

export const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp({
      format: "YYYY-MM-DD HH:mm:ss",
    }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: "user-service" },
  exitOnError: false,
  transports: [
    //
    // - Write all logs with importance level of `error` or less to `error.log`
    // - Write all logs with importance level of `info` or less to `combined.log`
    //
    new winston.transports.File({ filename: "data/logs/error.log", level: "error" }),
    new winston.transports.File({ filename: "data/logs/warn.log", level: "warn" }),
    new winston.transports.File({ filename: "data/logs/info.log", level: "info" }),
    new winston.transports.File({ filename: "data/logs/http.log", level: "http" }),
    new winston.transports.File({ filename: "data/logs/debug.log", level: "debug" }),
  ],
});

//
// If we're not in production then log to the `console` with the format:
// `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
//
if (!version.production) {
  logger.add(
    new winston.transports.Console({
      format: winston.format.simple(),
    })
  );
}
