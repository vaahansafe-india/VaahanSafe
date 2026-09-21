export * from "./redaction";
export * from "./correlation";
export * from "./normalization";

import { redactSensitiveData, sanitizeString } from "./redaction";
import { generateRequestId, generateErrorId } from "./correlation";
import { normalizeSafeError } from "./normalization";

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogPayload {
  level: LogLevel;
  service: string;
  message: string;
  environment?: string;
  requestId?: string;
  correlationId?: string;
  event?: string;
  timestamp: string;
  context?: Record<string, unknown>;
  error?: {
    code: string;
    message: string;
    reference?: string;
  };
}

/**
 * Legacy correlation ID generator using underscore format (req_..., err_...)
 */
export function generateCorrelationId(prefix = "req"): string {
  const random = Math.random().toString(36).substring(2, 10);
  const timestamp = Date.now().toString(36);
  return `${prefix}_${timestamp}_${random}`;
}

export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly reference: string;

  constructor(
    message: string,
    code: string = "ERR/VHN/INTERNAL",
    statusCode: number = 500,
    isOperational: boolean = true
  ) {
    super(message);
    this.name = "AppError";
    this.code = code.startsWith("ERR/") ? code : `ERR/${code}`;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.reference = generateCorrelationId("err");
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Legacy error normalizer preserving ERR/VHN/... contract
 */
export function normalizeError(error: unknown, fallbackMessage = "An unexpected error occurred") {
  if (error instanceof AppError) {
    return {
      message: error.message,
      code: error.code,
      reference: error.reference,
      statusCode: error.statusCode,
    };
  }

  const reference = generateCorrelationId("err");
  const message =
    process.env.NODE_ENV === "production"
      ? fallbackMessage
      : error instanceof Error
      ? error.message
      : fallbackMessage;

  return {
    message,
    code: "ERR/VHN/INTERNAL",
    reference,
    statusCode: 500,
  };
}

export interface Logger {
  debug(message: string, context?: Record<string, unknown>): void;
  info(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
  error(message: string, error?: unknown, context?: Record<string, unknown>): void;
  event(eventName: string, message: string, context?: Record<string, unknown>): void;
}

export function createLogger(
  service: string,
  options?: {
    correlationId?: string;
    requestId?: string;
    environment?: string;
  }
): Logger {
  const correlationId = options?.correlationId;
  const requestId = options?.requestId || generateRequestId();
  const environment =
    options?.environment ||
    process.env.NEXT_PUBLIC_APP_ENV ||
    process.env.NODE_ENV ||
    "development";

  function log(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>,
    err?: unknown,
    eventName?: string
  ) {
    const safeContext = context ? redactSensitiveData(context) : undefined;
    const safeMessage = sanitizeString(message);

    const payload: LogPayload = {
      level,
      service,
      environment,
      requestId,
      correlationId,
      event: eventName,
      message: safeMessage,
      timestamp: new Date().toISOString(),
      context: safeContext as Record<string, unknown>,
    };

    if (err) {
      const normalized = normalizeSafeError(err);
      payload.error = {
        code: normalized.code,
        message: normalized.message,
        reference: normalized.reference,
      };
    }

    const output = JSON.stringify(payload);
    if (level === "error") {
      console.error(output);
    } else if (level === "warn") {
      console.warn(output);
    } else {
      console.log(output);
    }
  }

  return {
    debug: (msg, ctx) => log("debug", msg, ctx),
    info: (msg, ctx) => log("info", msg, ctx),
    warn: (msg, ctx) => log("warn", msg, ctx),
    error: (msg, err, ctx) => log("error", msg, ctx, err),
    event: (eventName, msg, ctx) => log("info", msg, ctx, undefined, eventName),
  };
}
