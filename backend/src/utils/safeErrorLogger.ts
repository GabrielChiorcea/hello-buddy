/**
 * Logging sigur pentru erori - fără stack traces / date sensibile în producție
 */

import { errorLogger } from '../config/logger.js';
import { isProduction } from '../config/env.js';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return String(error);
}

function getErrorCode(error: unknown): string | undefined {
  if (error && typeof error === 'object' && 'code' in error && typeof (error as { code: unknown }).code === 'string') {
    return (error as { code: string }).code;
  }
  return undefined;
}

function getErrorStack(error: unknown): string | undefined {
  if (error instanceof Error && error.stack) {
    return error.stack;
  }
  return undefined;
}

/**
 * Loghează o eroare în mod sigur.
 * În producție: doar mesaj și cod (fără stack).
 * În dev: include stack pentru debugging.
 */
export function logError(context: string, error: unknown): void {
  const message = getErrorMessage(error);
  const code = getErrorCode(error);
  const stack = getErrorStack(error);

  const meta: Record<string, unknown> = {
    context,
    code: code ?? undefined,
  };

  if (!isProduction && stack) {
    meta.stack = stack;
  }

  errorLogger.error(message, meta);
}
