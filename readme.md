# Typescript Boilerplate

This repository serves as a boilerplate for starting new TypeScript projects. It provides a basic project setup and configurations to kickstart development quickly.

## Features

- TypeScript support with strict type checking
- Configurable logging using `winston`
- Environment-based configuration management with `config`
- Pre-configured ESLint and Prettier for code quality
- Husky for Git hooks to enforce code quality checks

## Installation

To get started, clone the repository and install the dependencies:

```bash
$ pnpm install
```

## Running the application server

```bash
# production
$ pnpm start

# watch mode
$ pnpm start:dev
```

## Configuration

Configuration is managed using the `config` package. To set up the configurations for the project, follow these steps:

1. **Create Configuration Files**: In the `config` directory, you will find a sample configuration file named `default.sample.yml`. Copy this file and rename it to `default.yml`:

   ```bash
   $ cp config/default.sample.yml config/default.yml
   ```

2. **Edit Configuration Values**: Open `config/default.yml` and modify the values according to your requirements.

3. **Environment-Specific Configurations**: If you need different configurations for different environments (e.g., development, production), you can create additional YAML files like `production.yml` or `development.yml`. The `config` package will automatically load the appropriate configuration based on the `NODE_ENV` environment variable.

## Logging

This boilerplate uses `winston` for logging. The logging options can be configured in the configuration files. By default, the logger is set up to log messages to the console and log files. You can optionally enable logging to CloudWatch. You can set the logging level, enable or disable file logs, and configure CloudWatch settings in the config file.

## Scripts

The following scripts are available:

- `build`: Compiles the TypeScript files to JavaScript.
- `start`: Builds the project and starts the application.
- `start:dev`: Runs the application in development mode with hot reloading.
- `test`: Runs the test suite.
- `lint`: Lints the codebase using ESLint.
- `lint:fix`: Automatically fixes linting issues.
