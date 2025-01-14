import 'dotenv/config'; // required for loading the 'NODE_ENV' environment variable
import logger from './utils/logging/logger';

function greet() {
  logger.info('Hello World');
  logger.error('This is an error message');
  logger.warn('This is a warning message');
  logger.debug('This is a debug message');
}

greet();
