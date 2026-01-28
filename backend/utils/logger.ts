/**
 * 結構化 Logger - Serverless 友善版本
 *
 * 在 Vercel/Serverless 環境中，使用結構化的 console 輸出。
 * 日誌會被自動收集到 Vercel 的日誌系統。
 *
 * @module utils/logger
 */

/**
 * 日誌等級
 */
export enum LogLevel {
  DEBUG = "debug",
  INFO = "info",
  WARN = "warn",
  ERROR = "error",
}

/**
 * 日誌介面
 */
interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

/**
 * Logger 類別
 */
class Logger {
  private serviceName: string;
  private environment: string;

  constructor(serviceName: string = "coach-aaron-api") {
    this.serviceName = serviceName;
    this.environment = process.env.NODE_ENV || "development";
  }

  /**
   * 格式化日誌訊息
   */
  private formatLog(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>,
    error?: Error,
  ): LogEntry {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
    };

    if (context) {
      logEntry.context = {
        ...context,
        service: this.serviceName,
        environment: this.environment,
      };
    }

    if (error) {
      logEntry.error = {
        name: error.name,
        message: error.message,
        stack: this.environment === "development" ? error.stack : undefined,
      };
    }

    return logEntry;
  }

  /**
   * 輸出日誌
   */
  private log(entry: LogEntry): void {
    const output = JSON.stringify(entry);

    switch (entry.level) {
      case LogLevel.ERROR:
        console.error(output);
        break;
      case LogLevel.WARN:
        console.warn(output);
        break;
      case LogLevel.DEBUG:
        if (this.environment === "development") {
          console.debug(output);
        }
        break;
      default:
        console.log(output);
    }
  }

  /**
   * Debug 等級日誌
   */
  debug(message: string, context?: Record<string, unknown>): void {
    this.log(this.formatLog(LogLevel.DEBUG, message, context));
  }

  /**
   * Info 等級日誌
   */
  info(message: string, context?: Record<string, unknown>): void {
    this.log(this.formatLog(LogLevel.INFO, message, context));
  }

  /**
   * Warn 等級日誌
   */
  warn(message: string, context?: Record<string, unknown>): void {
    this.log(this.formatLog(LogLevel.WARN, message, context));
  }

  /**
   * Error 等級日誌
   */
  error(
    message: string,
    error?: unknown,
    context?: Record<string, unknown>,
  ): void {
    const normalizedError = error instanceof Error ? error : undefined;
    const errorContext =
      error && !(error instanceof Error)
        ? { ...context, rawError: String(error) }
        : context;
    this.log(
      this.formatLog(LogLevel.ERROR, message, errorContext, normalizedError),
    );
  }
}

/**
 * 匯出 Logger 實例
 */
export const logger = new Logger();
