/**
 * Logger centralizat cu rotație de fișiere
 * - maxSize: 20MB, maxFiles: 14d, zippedArchive
 * - Fișiere: app.log, security.log, error.log
 */

import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { env } from './env.js';

const { LOG_DIR, LOG_LEVEL, LOG_TO_CONSOLE } = env;

const baseRotateOptions = {
  dirname: LOG_DIR,
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '14d',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
};

const transports: winston.transport[] = [];

if (LOG_TO_CONSOLE) {
  transports.push(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.printf(({ level, message, timestamp }) => `${timestamp} [${level.toUpperCase()}] ${message}`)
      ),
    })
  );
}

transports.push(
  new DailyRotateFile({
    ...baseRotateOptions,
    filename: 'app-%DATE%.log',
    level: LOG_LEVEL,
  } as DailyRotateFile.DailyRotateFileTransportOptions)
);

export const logger = winston.createLogger({
  level: LOG_LEVEL,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports,
});

const securityTransport = new DailyRotateFile({
  ...baseRotateOptions,
  filename: 'security-%DATE%.log',
  level: 'info',
} as DailyRotateFile.DailyRotateFileTransportOptions);

export const securityLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    ...(LOG_TO_CONSOLE
      ? [
          new winston.transports.Console({
            format: winston.format.combine(
              winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
              winston.format.printf(({ level, message, timestamp }) => `${timestamp} [${level.toUpperCase()}] ${message}`)
            ),
          }),
        ]
      : []),
    securityTransport,
  ],
});

const errorTransport = new DailyRotateFile({
  ...baseRotateOptions,
  filename: 'error-%DATE%.log',
  level: 'error',
} as DailyRotateFile.DailyRotateFileTransportOptions);

export const errorLogger = winston.createLogger({
  level: 'error',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    ...(LOG_TO_CONSOLE
      ? [
          new winston.transports.Console({
            format: winston.format.combine(
              winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
              winston.format.printf(({ level, message, timestamp }) => `${timestamp} [${level.toUpperCase()}] ${message}`)
            ),
          }),
        ]
      : []),
    errorTransport,
  ],
});
