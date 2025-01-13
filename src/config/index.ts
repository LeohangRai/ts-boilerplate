import 'dotenv/config';

export const APP_CONFIG = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  ENABLE_CLOUDWATCH_LOGGING: process.env.ENABLE_CLOUDWATCH_LOGGING === 'true',
};

export const CLOUDWATCH_CONFIG = {
  LOG_GROUP_NAME: process.env.CLOUDWATCH_GROUP_NAME,
  LOG_STREAM_NAME: process.env.CLOUDWATCH_STREAM_NAME,
  REGION: process.env.CLOUDWATCH_REGION,
  ACCESS_KEY_ID: process.env.CLOUDWATCH_ACCESS_KEY_ID,
  SECRET_ACCESS_KEY: process.env.CLOUDWATCH_SECRET_ACCESS_KEY,
};
