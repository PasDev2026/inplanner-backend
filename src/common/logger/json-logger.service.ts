import { ConsoleLogger } from '@nestjs/common';

export class JsonLogger extends ConsoleLogger {
  private isProduction(): boolean {
    return process.env.NODE_ENV === 'production';
  }

  private formatJson(
    level: string,
    message: string,
    context?: string,
    meta?: Record<string, unknown>,
  ) {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      context: context || this.context,
      message,
      ...meta,
    });
  }

  log(message: string, context?: string) {
    if (this.isProduction()) {
      process.stdout.write(this.formatJson('info', message, context) + '\n');
    } else {
      super.log(message, context);
    }
  }

  error(message: string, trace?: string, context?: string) {
    if (this.isProduction()) {
      process.stderr.write(
        this.formatJson('error', message, context, { trace }) + '\n',
      );
    } else {
      super.error(message, trace, context);
    }
  }

  warn(message: string, context?: string) {
    if (this.isProduction()) {
      process.stdout.write(this.formatJson('warn', message, context) + '\n');
    } else {
      super.warn(message, context);
    }
  }

  debug(message: string, context?: string) {
    if (this.isProduction()) {
      process.stdout.write(this.formatJson('debug', message, context) + '\n');
    } else {
      super.debug(message, context);
    }
  }

  verbose(message: string, context?: string) {
    if (this.isProduction()) {
      process.stdout.write(this.formatJson('verbose', message, context) + '\n');
    } else {
      super.verbose(message, context);
    }
  }
}
