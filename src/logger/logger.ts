import winston, { Logform } from 'winston';
import WinstonCloudwatch from 'winston-cloudwatch';
import DailyRotateFile from 'winston-daily-rotate-file';
import { APP_CONFIG, CLOUDWATCH_CONFIG } from '../config';
const { combine, timestamp, json, colorize, printf } = winston.format;

const consoleLoggingFormatOptions: Logform.Format = combine(
  timestamp({ format: 'YYYY-MM-DD hh:mm:ss.SSS A' }),
  json(),
  colorize({ all: true }),
  printf((info) => `[${info.timestamp}] (${info.level}): ${info.message}`),
);

const fileLoggingFormatOptions: Logform.Format = combine(
  timestamp({ format: 'YYYY-MM-DD hh:mm:ss.SSS A' }),
  json(),
);

const errorLogFilter = winston.format((info) => {
  return info.level === 'error' ? info : false;
});

const infoLogFilter = winston.format((info) => {
  return info.level === 'info' ? info : false;
});

export class LoggerSingleton {
  static instance: LoggerSingleton;
  private logger: winston.Logger;
  constructor() {
    this.logger = winston.createLogger({
      /*
        The 'level' property is used to determine the minimum severity of log entries that will be written to the log file.
        If the 'NODE_ENV' environment variable is set to 'production', only logger entries with a minimum severity of 'info' will be written while all others are suppressed
        If the 'NODE_ENV' environment variable is set to anything other than 'production', all log entries will be written to the log file (except 'silly')
      */
      level: APP_CONFIG.NODE_ENV === 'production' ? 'info' : 'debug',
      transports: this.getTransports(APP_CONFIG.ENABLE_CLOUDWATCH_LOGGING),
    });
  }

  public static getInstance(): winston.Logger {
    if (!LoggerSingleton.instance) {
      LoggerSingleton.instance = new LoggerSingleton();
    }
    return LoggerSingleton.instance.logger;
  }

  private getTransports(isCloudWatchEnabled: boolean): winston.transport[] {
    if (isCloudWatchEnabled) {
      const cloudWatchConfig: WinstonCloudwatch.CloudwatchTransportOptions = {
        messageFormatter: ({ level, message }) => `[${level}] : ${message}`,
        logGroupName: CLOUDWATCH_CONFIG.LOG_GROUP_NAME,
        logStreamName: CLOUDWATCH_CONFIG.LOG_STREAM_NAME,
        awsRegion: CLOUDWATCH_CONFIG.REGION,
        awsOptions: {
          credentials: {
            accessKeyId: CLOUDWATCH_CONFIG.ACCESS_KEY_ID!,
            secretAccessKey: CLOUDWATCH_CONFIG.SECRET_ACCESS_KEY!,
          },
        },
      };
      return [new WinstonCloudwatch(cloudWatchConfig)];
    }
    return [
      new winston.transports.Console({
        format: consoleLoggingFormatOptions,
      }),
      new DailyRotateFile({
        filename: `${APP_CONFIG.LOG_DIR}/combined-%DATE%.log`,
        datePattern: 'YYYY-MM-DD', // controls how often the file should be rotated (everyday in this case)
        zippedArchive: true,
        maxSize: '20m', // maximum size of the file after which it will rotate (meaning, a new log file will be created)
        maxFiles: '14d', // ensures that log files that are older than 14 days are automatically deleted
      }),
      new DailyRotateFile({
        filename: `${APP_CONFIG.LOG_DIR}/error-%DATE%.log`,
        level: 'error',
        format: combine(errorLogFilter(), fileLoggingFormatOptions),
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: '10m',
        maxFiles: '14d',
      }),
      new DailyRotateFile({
        filename: `${APP_CONFIG.LOG_DIR}/info-%DATE%.log`,
        level: 'info',
        format: combine(infoLogFilter(), fileLoggingFormatOptions),
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: '10m',
        maxFiles: '14d',
      }),
    ];
  }
}

export default LoggerSingleton.getInstance();
