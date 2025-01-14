export interface LoggingOptions {
  level: string;
  fileLogs: {
    enable: boolean;
    logDir: string;
    rotation: {
      enable: boolean;
      maxSize: string;
      maxAge: string;
    };
  };
  cloudwatch: {
    enable: boolean;
    disableConsoleLogs: boolean;
    disableFileLogs: boolean;
  };
}
