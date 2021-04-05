import _ from "lodash";
import Path from "path";
import Winston from "winston";
import WinstonDailyRotateFile from "winston-daily-rotate-file";
import HTTPMethods from "../enums/server/HTTPMethods";

if (!process.env.API_DOMAIN) throw new Error("API_DOMAIN environmental value must be defined.");
if (!process.env.LOG_PATH) throw new Error("LOG_PATH environmental value must be defined.");

export enum LoggerLevels {
  ERROR = "error",
  REQUEST = "request",
  CONSOLE = "console"
}

export default _.assign(
  Winston.createLogger({
    format:     Winston.format.combine(
      Winston.format.timestamp(),
      Winston.format.json(),
    ),
    levels:     _.reduce(_.values(LoggerLevels), (r, v, k) => _.set(r, v, k), {}),
    transports: [
      new WinstonDailyRotateFile({
        level:         LoggerLevels.ERROR,
        filename:      `${process.env.API_DOMAIN}-error-%DATE%.log`,
        dirname:       Path.resolve(process.env.LOG_PATH),
        datePattern:   "YYYY-MM-DD",
        zippedArchive: true,
        maxSize:       "4m",
        format:        Winston.format.combine(
          Winston.format(info => info.level === LoggerLevels.ERROR ? info : false)(),
        ),
      }),
      new WinstonDailyRotateFile({
        level:         LoggerLevels.REQUEST,
        filename:      `${process.env.API_DOMAIN}-request-%DATE%.log`,
        dirname:       Path.resolve(process.env.LOG_PATH),
        datePattern:   "YYYY-MM-DD",
        zippedArchive: true,
        maxSize:       "4m",
        format:        Winston.format.combine(
          Winston.format(info => info.level === LoggerLevels.REQUEST ? info : false)(),
        ),
      }),
      new Winston.transports.Console({
        level:  LoggerLevels.CONSOLE,
        format: Winston.format.combine(
          Winston.format(info => info.level === LoggerLevels.CONSOLE ? info : false)(),
          Winston.format.printf((info) => `[${info.timestamp}] ${info.message}`),
        ),
      }),
    ],
  }) as Logger,
  {
    constants: {
      levels: LoggerLevels,
    },
  },
);

type Logger = Omit<Winston.Logger, "log"> & {
  log: <L extends LoggerLevels>(message: LoggerObject<L>) => void
}

type LoggerObject<L extends LoggerLevels> =
  L extends LoggerLevels.ERROR ? {level: L; message: string; content?: any; stack?: string} :
  L extends LoggerLevels.REQUEST ? {level: L; message: string; method: HTTPMethods; path: string} :
  L extends LoggerLevels.CONSOLE ? {level: L; message: string} :
  never
