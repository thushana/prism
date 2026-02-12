/**
 * Server-side logger (Winston-based)
 * Use in API routes, server components, and CLI scripts
 */

import winston from "winston";

// Runtime check to prevent accidental use in browser
if (
  typeof globalThis !== "undefined" &&
  typeof (globalThis as unknown as { window?: unknown }).window !== "undefined"
) {
  throw new Error(
    "Server logger cannot be used in browser. Use logger/client instead."
  );
}

// Log levels in order of severity (Winston default)
const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  verbose: 4,
  debug: 5,
  silly: 6,
} as const;

type LogLevel = keyof typeof LOG_LEVELS;

// Emoji prefixes for context loggers
const contextEmojiMap = {
  search: "🔍",
  success: "✅",
  stats: "📊",
  cost: "💰",
  start: "🚀",
  error: "❌",
  warn: "⚠️",
  info: "ℹ️",
  http: "🌐",
  verbose: "🗒️",
  debug: "🐛",
  silly: "🤹",
} as const;

// Determine log level from environment
function getLogLevel(): LogLevel {
  // Check for LOG_LEVEL environment variable
  const envLevel = process.env.LOG_LEVEL as LogLevel | undefined;
  if (envLevel && envLevel in LOG_LEVELS) {
    return envLevel;
  }

  // Default based on NODE_ENV
  const nodeEnv = process.env.NODE_ENV;
  return nodeEnv === "production" ? "info" : "debug";
}

/**
 * Format metadata for logging
 */
function formatMetadata(meta: Record<string, unknown>): string {
  if (!meta || Object.keys(meta).length === 0) {
    return "";
  }

  try {
    // Extract error stack if present
    const formatted = { ...meta };
    if (formatted.error instanceof Error) {
      formatted.error = {
        message: formatted.error.message,
        stack: formatted.error.stack,
      };
    }
    return ` ${JSON.stringify(formatted)}`;
  } catch {
    return ` ${String(meta)}`;
  }
}

/**
 * Custom Winston format with timestamps and emojis (default mode)
 * Reserved for future use when switching from inline printf.
 */
const _customFormat = winston.format.printf(
  ({ level, message, timestamp, emoji, ...meta }) => {
    const emojiPrefix =
      emoji || contextEmojiMap[level as keyof typeof contextEmojiMap] || "";
    const metaStr = formatMetadata(meta as Record<string, unknown>);
    return `${timestamp} ${emojiPrefix} [${level.toUpperCase()}] ${message}${metaStr}`;
  }
);

/**
 * Clean CLI format without timestamps and log levels (CLI mode)
 * Reserved for future use when switching from inline printf.
 */
const _cliFormat = winston.format.printf(({ message, emoji, ...meta }) => {
  const emojiPrefix = emoji || "";
  const metaStr = formatMetadata(meta as Record<string, unknown>);
  return `${emojiPrefix}${emojiPrefix ? " " : ""}${message}${metaStr}`;
});

// Track CLI mode state
let isCLIMode = false;

/**
 * Main server logger instance (Winston)
 */
export const serverLogger = winston.createLogger({
  level: getLogLevel(),
  levels: LOG_LEVELS,
  format: winston.format.combine(
    winston.format.timestamp({
      format: "YYYY-MM-DD HH:mm:ss",
    }),
    // Use dynamic format based on CLI mode
    winston.format.printf((info) => {
      if (isCLIMode) {
        const emojiPrefix = info.emoji || "";
        const metaStr = formatMetadata(
          Object.keys(info)
            .filter(
              (key) =>
                ![
                  "level",
                  "message",
                  "timestamp",
                  "emoji",
                  "splat",
                  "Symbol(level)",
                  "Symbol(message)",
                ].includes(key)
            )
            .reduce(
              (acc, key) => {
                acc[key] = (info as Record<string, unknown>)[key];
                return acc;
              },
              {} as Record<string, unknown>
            )
        );
        return `${emojiPrefix}${emojiPrefix ? " " : ""}${info.message}${metaStr}`;
      }
      // Default format
      const emojiPrefix =
        info.emoji ||
        contextEmojiMap[info.level as keyof typeof contextEmojiMap] ||
        "";
      const metaStr = formatMetadata(
        Object.keys(info)
          .filter(
            (key) =>
              ![
                "level",
                "message",
                "timestamp",
                "emoji",
                "splat",
                "Symbol(level)",
                "Symbol(message)",
              ].includes(key)
          )
          .reduce(
            (acc, key) => {
              acc[key] = (info as Record<string, unknown>)[key];
              return acc;
            },
            {} as Record<string, unknown>
          )
      );
      return `${info.timestamp} ${emojiPrefix} [${info.level.toUpperCase()}] ${info.message}${metaStr}`;
    })
  ),
  transports: [new winston.transports.Console()],
});

/**
 * Create a context-specific logger with emoji prefix
 */
function contextLogger(emoji: string) {
  return (message: string, meta?: Record<string, unknown>) => {
    serverLogger.log("info", message, { ...meta, emoji });
  };
}

/**
 * Context-specific loggers with emoji prefixes
 */
export const logSearch = contextLogger(contextEmojiMap.search);
export const logSuccess = contextLogger(contextEmojiMap.success);
export const logStats = contextLogger(contextEmojiMap.stats);
export const logCost = contextLogger(contextEmojiMap.cost);
export const logStart = contextLogger(contextEmojiMap.start);

/**
 * Set log level at runtime
 */
export function setLogLevel(level: LogLevel): void {
  serverLogger.level = level;
}

/**
 * Enable CLI mode - removes timestamps and log levels for cleaner output
 */
export function setCLIMode(enabled: boolean = true): void {
  isCLIMode = enabled;
}

/**
 * Export logger with standard API (for consistency with client logger)
 */
export const logger = serverLogger;
