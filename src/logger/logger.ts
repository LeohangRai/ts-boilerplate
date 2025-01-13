import winston, { Logform } from 'winston';
import WinstonCloudwatch from 'winston-cloudwatch';
import { APP_CONFIG, CLOUDWATCH_CONFIG } from '../config';
const { combine, timestamp, json, colorize, align, printf } = winston.format;

const consoleLoggerFormatOptions: Logform.Format = combine(
  timestamp({ format: 'YYYY-MM-DD hh:mm:ss.SSS A' }),
  json(),
  colorize({ all: true }),
  printf((info) => `[${info.timestamp}] (${info.level}): ${info.message}`),
);

const fileLoggingFormatOptions: Logform.Format = combine(
  timestamp({ format: 'YYYY-MM-DD hh:mm:ss.SSS A' }),
  json(),
);

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
        format: consoleLoggerFormatOptions,
      }),
      new winston.transports.File({
        filename: '.logs/app.log',
        format: fileLoggingFormatOptions,
      }),
    ];
  }
}

export default LoggerSingleton.getInstance();
