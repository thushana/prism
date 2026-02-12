/**
 * Client-side logger (browser console wrapper)
 * Use in React components and client-side code
 */

// Log levels in order of severity
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
  // Check for NEXT_PUBLIC_LOG_LEVEL environment variable
  const envLevel = process.env.NEXT_PUBLIC_LOG_LEVEL as LogLevel | undefined;
  if (envLevel && envLevel in LOG_LEVELS) {
    return envLevel;
  }

  // Default based on NODE_ENV
  const nodeEnv = process.env.NODE_ENV;
  if (nodeEnv === "production") {
    return "info";
  }
  if (nodeEnv === "test") {
    return "silly"; // Allow all logs in tests
  }
  return "debug";
}

const currentLogLevel: LogLevel = getLogLevel();

/**
 * Check if a log level should be logged based on current log level
 */
function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] <= LOG_LEVELS[currentLogLevel];
}

/**
 * Format metadata for logging
 */
function formatMetadata(meta?: Record<string, unknown>): string {
  if (!meta) return "";

  try {
    // Extract error stack if present
    const formatted = { ...meta };
    if (formatted.error instanceof Error) {
      formatted.error = {
        message: formatted.error.message,
        stack: formatted.error.stack,
      };
    }
    return JSON.stringify(formatted);
  } catch {
    return String(meta);
  }
}

/**
 * Create a context-specific logger with emoji prefix
 */
function contextLogger(emoji: string) {
  return (message: string, meta?: Record<string, unknown>) => {
    if (!shouldLog("info")) return;

    const timestamp = new Date()
      .toISOString()
      .replace("T", " ")
      .substring(0, 19);
    const metaStr = meta ? ` ${formatMetadata(meta)}` : "";
    console.log(`${timestamp} ${emoji} [INFO] ${message}${metaStr}`);
  };
}

/**
 * Main client logger instance
 */
export const logger = {
  error: (message: string, meta?: Record<string, unknown>) => {
    if (!shouldLog("error")) return;

    const timestamp = new Date()
      .toISOString()
      .replace("T", " ")
      .substring(0, 19);
    const metaStr = meta ? ` ${formatMetadata(meta)}` : "";
    console.error(
      `${timestamp} ${contextEmojiMap.error} [ERROR] ${message}${metaStr}`
    );
  },

  warn: (message: string, meta?: Record<string, unknown>) => {
    if (!shouldLog("warn")) return;

    const timestamp = new Date()
      .toISOString()
      .replace("T", " ")
      .substring(0, 19);
    const metaStr = meta ? ` ${formatMetadata(meta)}` : "";
    console.warn(
      `${timestamp} ${contextEmojiMap.warn} [WARN] ${message}${metaStr}`
    );
  },

  info: (message: string, meta?: Record<string, unknown>) => {
    if (!shouldLog("info")) return;

    const timestamp = new Date()
      .toISOString()
      .replace("T", " ")
      .substring(0, 19);
    const metaStr = meta ? ` ${formatMetadata(meta)}` : "";
    console.log(
      `${timestamp} ${contextEmojiMap.info} [INFO] ${message}${metaStr}`
    );
  },

  http: (message: string, meta?: Record<string, unknown>) => {
    if (!shouldLog("http")) return;

    const timestamp = new Date()
      .toISOString()
      .replace("T", " ")
      .substring(0, 19);
    const metaStr = meta ? ` ${formatMetadata(meta)}` : "";
    console.log(
      `${timestamp} ${contextEmojiMap.http} [HTTP] ${message}${metaStr}`
    );
  },

  verbose: (message: string, meta?: Record<string, unknown>) => {
    if (!shouldLog("verbose")) return;

    const timestamp = new Date()
      .toISOString()
      .replace("T", " ")
      .substring(0, 19);
    const metaStr = meta ? ` ${formatMetadata(meta)}` : "";
    console.log(
      `${timestamp} ${contextEmojiMap.verbose} [VERBOSE] ${message}${metaStr}`
    );
  },

  debug: (message: string, meta?: Record<string, unknown>) => {
    if (!shouldLog("debug")) return;

    const timestamp = new Date()
      .toISOString()
      .replace("T", " ")
      .substring(0, 19);
    const metaStr = meta ? ` ${formatMetadata(meta)}` : "";
    console.log(
      `${timestamp} ${contextEmojiMap.debug} [DEBUG] ${message}${metaStr}`
    );
  },

  silly: (message: string, meta?: Record<string, unknown>) => {
    if (!shouldLog("silly")) return;

    const timestamp = new Date()
      .toISOString()
      .replace("T", " ")
      .substring(0, 19);
    const metaStr = meta ? ` ${formatMetadata(meta)}` : "";
    console.log(
      `${timestamp} ${contextEmojiMap.silly} [SILLY] ${message}${metaStr}`
    );
  },

  log: (level: LogLevel, message: string, meta?: Record<string, unknown>) => {
    if (!shouldLog(level)) return;

    const timestamp = new Date()
      .toISOString()
      .replace("T", " ")
      .substring(0, 19);
    const metaStr = meta ? ` ${formatMetadata(meta)}` : "";
    const emoji = contextEmojiMap[level] || "";
    console.log(
      `${timestamp} ${emoji} [${level.toUpperCase()}] ${message}${metaStr}`
    );
  },
};

/**
 * Context-specific loggers with emoji prefixes
 */
export const logSearch = contextLogger(contextEmojiMap.search);
export const logSuccess = contextLogger(contextEmojiMap.success);
export const logStats = contextLogger(contextEmojiMap.stats);
export const logCost = contextLogger(contextEmojiMap.cost);
export const logStart = contextLogger(contextEmojiMap.start);

/**
 * Set log level at runtime (no-op for client logger)
 * Client log level is determined by environment variables only
 */
export function setLogLevel(_level: LogLevel): void {
  // No-op for client logger - log level is environment-based only
  // This function exists for API compatibility with server logger
}
