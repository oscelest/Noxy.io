import FS from "fs";
import _ from "lodash";
import Path from "path";
import winston from "winston";
import WinstonDailyRotateFile from "winston-daily-rotate-file";

if (!process.env.SERVICE) throw new Error("SERVICE environmental value must be defined.");
if (!process.env.LOG_PATH) throw new Error("LOG_PATH environmental value must be defined.");

FS.mkdir(process.env.LOG_PATH, _.noop);

module Logger {

  const logger_collection: { [K in Level]?: winston.Logger } = {};

  export enum Level {
    ERROR = "error",
    WARNING = "warn",
    INFO = "info",
    HTTP = "http",
  }

  export function write(level: Level, message: any): winston.Logger {
    return (logger_collection[level] ?? (logger_collection[level] = createLogger(level))).log(level, message);
  }

  function createLogger(level: Level): winston.Logger {
    if (!process.env.SERVICE) throw new Error("SERVICE environmental value must be defined.");
    if (!process.env.LOG_PATH) throw new Error("LOG_PATH environmental value must be defined.");

    switch (level) {
      case Level.ERROR:
      case Level.WARNING:
      case Level.HTTP:
        return winston.createLogger({
          level:      level,
          format:     winston.format.combine(winston.format.json(), winston.format.timestamp()),
          transports: new WinstonDailyRotateFile({
            filename:      `${process.env.SERVICE}-${level}-%DATE%.log`,
            dirname:       Path.resolve(process.env.LOG_PATH),
            datePattern:   "YYYY-MM-DD",
            zippedArchive: true,
            maxSize:       "4m",
          }),
        });
      case Level.INFO:
        return winston.createLogger({
          level:      level,
          format:     winston.format.printf(info => `[${new Date().toISOString()}] ${info.message}`),
          transports: new winston.transports.Console(),
        });
      default:
        throw new Error();
    }
  }

}

export default Logger;
