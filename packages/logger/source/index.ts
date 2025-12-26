/**
 * Logger package - Centralized logging infrastructure
 *
 * Usage:
 * - Client components: import from "@logger/client"
 * - Server code: import from "@logger/server"
 * - Or use direct exports for convenience
 */

// Re-export client logger
export {
  logger as clientLogger,
  logSearch as clientLogSearch,
  logSuccess as clientLogSuccess,
  logStats as clientLogStats,
  logCost as clientLogCost,
  logStart as clientLogStart,
  setLogLevel as clientSetLogLevel,
} from "./client";

// Re-export server logger
export {
  serverLogger,
  logger,
  logSearch,
  logSuccess,
  logStats,
  logCost,
  logStart,
  setLogLevel,
} from "./server";
