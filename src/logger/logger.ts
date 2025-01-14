import config from 'config';
import winston, { Logform } from 'winston';
import WinstonCloudwatch from 'winston-cloudwatch';
import DailyRotateFile from 'winston-daily-rotate-file';
import { LoggingOptions } from './types/logging-options.type';
const { combine, timestamp, json, colorize, printf } = winston.format;

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
  private loggingOptions: LoggingOptions;

  constructor() {
    this.setupLoggingOptions();
    this.logger = winston.createLogger({
      level: this.loggingOptions.level,
      transports: this.getTransports(),
    });
  }

  public static getInstance(): winston.Logger {
    if (!LoggerSingleton.instance) {
      LoggerSingleton.instance = new LoggerSingleton();
    }
    return LoggerSingleton.instance.logger;
  }

  private setupLoggingOptions() {
    const isProduction = config.get<string>('app.env') === 'production';
    // the 'level' property is used to determine the minimum severity of log entries that will be written to the log transport (debug < verbose < info < warn < error)
    const level =
      config.get<string>('logging.level') || (isProduction ? 'info' : 'debug');
    this.loggingOptions = {
      level,
      fileLogs: {
        enable: config.get<boolean>('logging.file_logs.enable') ?? true,
        logDir: config.get<string>('logging.file_logs.log_dir') || '.logs',
        rotation: {
          enable:
            config.get<boolean>('logging.file_logs.rotation.enable') ?? false,
          maxSize:
            config.get<string>('logging.file_logs.rotation.max_size') || '10m',
          maxAge:
            config.get<string>('logging.file_logs.rotation.max_age') || '7d',
        },
      },
      cloudwatch: {
        enable: config.get<boolean>('logging.cloudwatch.enable') ?? false,
        // disable console and file transports by default if cloudwatch is enabled
        disableConsoleLogs:
          config.get<boolean>('logging.cloudwatch.disable_console_logs') ??
          true,
        disableFileLogs:
          config.get<boolean>('logging.cloudwatch.disable_file_logs') ?? true,
      },
    };
  }

  private getConsoleTransport(): winston.transport {
    return new winston.transports.Console({
      format: combine(
        timestamp({ format: 'YYYY-MM-DD hh:mm:ss.SSS A' }),
        json(),
        colorize({ all: true }),
        printf(
          (info) => `[${info.timestamp}] (${info.level}): ${info.message}`,
        ),
      ),
    });
  }

  private getFileTransportsWithoutRotation(): winston.transport[] {
    const logDir = this.loggingOptions.fileLogs.logDir;
    return [
      new winston.transports.File({
        filename: `${logDir}/combined.log`,
        format: combine(fileLoggingFormatOptions),
      }),
      new winston.transports.File({
        filename: `${logDir}/error.log`,
        level: 'error',
        format: combine(errorLogFilter(), fileLoggingFormatOptions),
      }),
      new winston.transports.File({
        filename: `${logDir}/info.log`,
        level: 'info',
        format: combine(infoLogFilter(), fileLoggingFormatOptions),
      }),
    ];
  }

  private getFileTransportsWithRotation(): winston.transport[] {
    const logDir = this.loggingOptions.fileLogs.logDir;
    const maxAge = this.loggingOptions.fileLogs.rotation.maxAge;
    const maxSize = this.loggingOptions.fileLogs.rotation.maxSize;
    const commonOpts: DailyRotateFile.DailyRotateFileTransportOptions = {
      datePattern: 'YYYY-MM-DD', // controls how often the file should be rotated (everyday in this case),
      maxSize, // maximum size of the file after which it will rotate (meaning, a new log file will be created)
      maxFiles: maxAge, // ensures that log files that are older than 14 days are automatically deleted,
      zippedArchive: true, // compress the log files
      /* 
        adding the 'filename' property so that it is interpreted as a file and not a stream 
        ```
          type DailyRotateFileTransportOptions = RequireOnlyOne<GeneralDailyRotateFileTransportOptions, 'filename' | 'stream'>;
        ```
      */
      filename: '',
    };
    return [
      new DailyRotateFile({
        ...commonOpts,
        filename: `${logDir}/combined-%DATE%.log`,
      }),
      new DailyRotateFile({
        ...commonOpts,
        filename: `${logDir}/error-%DATE%.log`,
        level: 'error',
        format: combine(errorLogFilter(), fileLoggingFormatOptions),
      }),
      new DailyRotateFile({
        ...commonOpts,
        filename: `${logDir}/info-%DATE%.log`,
        level: 'info',
        format: combine(infoLogFilter(), fileLoggingFormatOptions),
      }),
    ];
  }

  private getFileTransports(): winston.transport[] {
    const isRotationEnabled = this.loggingOptions.fileLogs.rotation.enable;
    if (isRotationEnabled) {
      return this.getFileTransportsWithRotation();
    }
    return this.getFileTransportsWithoutRotation();
  }

  private getCloudWatchTransport(): WinstonCloudwatch {
    const cloudWatchConfig: WinstonCloudwatch.CloudwatchTransportOptions = {
      messageFormatter: ({ level, message }) => `[${level}] : ${message}`,
      logGroupName: config.get<string>('logging.cloudwatch.group_name'),
      logStreamName: config.get<string>('logging.cloudwatch.stream_name'),
      awsRegion: config.get<string>('logging.cloudwatch.region'),
      awsOptions: {
        credentials: {
          accessKeyId: config.get<string>('logging.cloudwatch.access_key_id'),
          secretAccessKey: config.get<string>(
            'logging.cloudwatch.secret_access_key',
          ),
        },
      },
    };
    return new WinstonCloudwatch(cloudWatchConfig);
  }

  private getTransports(): winston.transport[] {
    const isCloudWatchEnabled = this.loggingOptions.cloudwatch.enable;
    if (isCloudWatchEnabled) {
      const transports: winston.transport[] = [this.getCloudWatchTransport()];
      if (!this.loggingOptions.cloudwatch.disableConsoleLogs) {
        transports.push(this.getConsoleTransport());
      }
      if (!this.loggingOptions.cloudwatch.disableFileLogs) {
        transports.push(...this.getFileTransports());
      }
      return transports;
    }
    const isFileLogsEnabled = this.loggingOptions.fileLogs.enable;
    if (!isFileLogsEnabled) {
      return [this.getConsoleTransport()];
    }
    return [this.getConsoleTransport(), ...this.getFileTransports()];
  }
}

export default LoggerSingleton.getInstance();
