/* eslint-disable no-console */
import { Config } from '@/config/env';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: unknown;
  timestamp: string;
}

const serializeData = (data: unknown): string => {
  if (data === undefined) return '';
  if (data instanceof Error) {
    const errorObj: Record<string, any> = {
      name: data.name,
      message: data.message,
      stack: data.stack,
    };
    Object.getOwnPropertyNames(data).forEach((prop) => {
      if (prop !== 'name' && prop !== 'message' && prop !== 'stack') {
        errorObj[prop] = (data as any)[prop];
      }
    });
    return ` ${JSON.stringify(errorObj)}`;
  }
  return ` ${JSON.stringify(data)}`;
};

const formatEntry = (entry: LogEntry): string => {
  const prefix = `[Spendly][${entry.timestamp}][${entry.level.toUpperCase()}]`;
  const data = serializeData(entry.data);
  return `${prefix} ${entry.message}${data}`;
};

const log = (level: LogLevel, messageOrError: unknown, data?: unknown): void => {
  // In production: suppress debug & info logs entirely — no console output.
  if (Config.isProd && (level === 'debug' || level === 'info')) return;

  // In development: suppress debug logs unless explicitly in dev mode.
  if (!Config.isDev && level === 'debug') return;

  let finalMessage = '';
  let finalData = data;

  if (messageOrError instanceof Error) {
    finalMessage = messageOrError.message;
    if (data === undefined) {
      finalData = messageOrError;
    }
  } else if (typeof messageOrError === 'string') {
    finalMessage = messageOrError;
  } else if (messageOrError === null) {
    finalMessage = 'null';
    if (data === undefined) {
      finalData = null;
    }
  } else if (messageOrError === undefined) {
    finalMessage = 'undefined';
  } else {
    finalMessage = String(messageOrError);
    if (data === undefined) {
      finalData = messageOrError;
    }
  }

  const entry: LogEntry = {
    level,
    message: finalMessage,
    data: finalData,
    timestamp: new Date().toISOString(),
  };

  const formatted = formatEntry(entry);

  // Production error handling: forward to crash reporter (Sentry integration point).
  // In production, errors are reported silently — never leaked to console.
  if (Config.isProd) {
    if (level === 'error') {
      // Sentry.captureMessage(formatted, 'error'); // Enabled once Sentry SDK is configured
    }
    return; // No console output in production under any circumstance
  }

  // Development-only console output
  const consoleFn = level === 'error'
    ? console.error
    : level === 'warn'
    ? console.warn
    : console.log;
  consoleFn(formatted);
};

export const logger = {
  debug: (message: unknown, data?: unknown) => log('debug', message, data),
  info:  (message: unknown, data?: unknown) => log('info',  message, data),
  warn:  (message: unknown, data?: unknown) => log('warn',  message, data),
  error: (message: unknown, data?: unknown) => log('error', message, data),
} as const;
