# Logger Documentation

> **Status**: Centralized logging infrastructure is planned but not yet implemented. This document describes the intended design for when logging is added.

## Overview

When implemented, the application will use separate loggers for client and server code to prevent bundling issues. Both loggers will provide the same API for consistent developer experience:

- **Client-side**: `logger-client.ts` - Uses browser `console.*` methods
- **Server-side**: `logger-server.ts` - Uses **Winston** for Node.js logging

Both loggers will support emoji-prefixed messages for better readability and context. All logging will go through these logger instances to ensure consistency across the codebase.

## Current State

For now, use `console.log`, `console.error`, and `console.warn` appropriately. When the logger is implemented, these can be migrated to use the centralized logger.

## Design Philosophy

1. **Unified API**: Same interface for client and server code
2. **Contextual**: Emoji prefixes provide visual context at a glance
3. **Structured**: Errors and metadata are properly serialized
4. **Configurable**: Log levels can be adjusted via environment variables
5. **No Console**: All direct `console.log/error/warn` calls are replaced with logger calls
6. **Environment-Aware**: Automatically uses the right logger for the context

## Usage

### Client-Side Logging

For client components (React components, pages):

```typescript
import { logger } from "@/library/logger/client";

// Standard log levels
logger.error("Operation failed", { error });
logger.warn("Deprecated feature used");
logger.info("Processing started");
logger.debug("Debug information", { data });
```

### Server-Side Logging

For server code (API routes, server components, CLI scripts):

```typescript
import { serverLogger as logger } from "@/library/logger/server";

// Standard log levels
logger.error("Operation failed", { error });
logger.warn("Deprecated feature used");
logger.info("Processing started");
logger.debug("Debug information", { data });
```

**Note**: You can alias `serverLogger` to `logger` for consistency:

```typescript
import { serverLogger as logger } from "@/library/logger/server";
```

### Context-Specific Loggers

For common operations, use context-specific loggers that automatically prefix messages with relevant emojis. These are available in both client and server loggers:

**Client-side:**

```typescript
import {
  logSearch,
  logSuccess,
  logStats,
  logCost,
  logStart,
} from "@/library/logger/client";

logSearch("Searching for places..."); // 🔍 Searching for places...
logSuccess("Operation completed"); // ✅ Operation completed
logStats("Found 42 places"); // 📊 Found 42 places
logCost("Total cost: $12.50"); // 💰 Total cost: $12.50
logStart("Starting crawl..."); // 🚀 Starting crawl...
```

**Server-side:**

```typescript
import {
  logSearch,
  logSuccess,
  logStats,
  logCost,
  logStart,
} from "@/library/logger/server";

logSearch("Searching for places..."); // 🔍 Searching for places...
logSuccess("Operation completed"); // ✅ Operation completed
logStats("Found 42 places"); // 📊 Found 42 places
logCost("Total cost: $12.50"); // 💰 Total cost: $12.50
logStart("Starting crawl..."); // 🚀 Starting crawl...
```

### Log Levels

The logger supports standard Winston log levels:

- `error` ❌ - Errors that need attention
- `warn` ⚠️ - Warnings about potential issues
- `info` ℹ️ - General informational messages
- `http` 🌐 - HTTP-related messages
- `verbose` 🗒️ - Verbose debugging information
- `debug` 🐛 - Detailed debugging information
- `silly` 🤹 - Very detailed debugging information

### Configuration

**Server-side** log level is determined by:

1. `LOG_LEVEL` environment variable (if set)
2. `NODE_ENV` environment variable:
   - `production` → `info` level
   - Otherwise → `debug` level

**Client-side** log level is determined by:

1. `NEXT_PUBLIC_LOG_LEVEL` environment variable (if set)
2. `NODE_ENV` environment variable:
   - `production` → `info` level
   - Otherwise → `debug` level

```bash
# Set log level via environment variable (server)
LOG_LEVEL=warn npm run tools crawl art_gallery

# Set log level for client (must be NEXT_PUBLIC_* to be available in browser)
NEXT_PUBLIC_LOG_LEVEL=debug

# Or in .env file
LOG_LEVEL=debug
NEXT_PUBLIC_LOG_LEVEL=debug
```

### Runtime Log Level Changes

**Server-side only**: You can change the log level at runtime:

```typescript
import { setLogLevel } from "@/library/logger/server";

setLogLevel("debug"); // Enable debug logging
setLogLevel("error"); // Only show errors
```

**Note**: Client-side `setLogLevel()` is a no-op. Client log levels are determined by environment variables only.

## Error Handling

The logger automatically handles Error objects in metadata:

```typescript
try {
  // ... operation
} catch (error) {
  // Error stack trace is automatically extracted
  logger.error("Operation failed", { error });
}
```

The logger will:

- Extract stack traces from Error objects
- Serialize object metadata as JSON
- Convert primitive values to strings

## Output Format

Log messages follow this format:

```
YYYY-MM-DD HH:mm:ss [EMOJI] [LEVEL] message [metadata]
```

Example:

```
2024-01-15 10:30:45 🔍 [INFO] Searching for places... {"count": 10}
2024-01-15 10:30:46 ✅ [INFO] Found 5 places
2024-01-15 10:30:47 ❌ [ERROR] Operation failed {"error": "Connection timeout"}
```

## Best Practices

### 1. Use Appropriate Log Levels

```typescript
// ✅ Good
logger.error("Database connection failed", { error });
logger.warn("API rate limit approaching");
logger.info("User logged in", { userId: 123 });
logger.debug("Processing item", { itemId: 456 });

// ❌ Bad
logger.error("User logged in"); // Should be info
logger.info("Database connection failed"); // Should be error
```

### 2. Include Context in Metadata

```typescript
// ✅ Good
logger.error("Failed to save place", {
  placeId: "ChIJ...",
  error: err,
  attempt: 3,
});

// ❌ Bad
logger.error("Failed to save place"); // No context
```

### 3. Use Context-Specific Loggers When Appropriate

```typescript
// ✅ Good
logSearch("Searching Google Maps API");
logSuccess("Crawl completed successfully");
logStats("Processed 100 places");

// ❌ Bad
logger.info("🔍 Searching Google Maps API"); // Use logSearch instead
```

### 4. Don't Log Sensitive Information

```typescript
// ❌ Bad
logger.info("User credentials", {
  username: "user@example.com",
  password: "secret123", // Never log passwords!
});

// ✅ Good
logger.info("User authenticated", {
  userId: 123,
  // Password excluded
});
```

### 5. Use Structured Metadata

```typescript
// ✅ Good
logger.info("Place saved", {
  placeId: "ChIJ...",
  name: "Coffee Shop",
  category: "cafe",
});

// ❌ Bad
logger.info(`Place saved: ${placeId}, ${name}, ${category}`); // Hard to parse
```

## Client vs Server Loggers

### Differences

| Feature                   | Client Logger               | Server Logger              |
| ------------------------- | --------------------------- | -------------------------- |
| **Implementation**        | Browser `console.*` methods | Winston (Node.js)          |
| **Environment Variable**  | `NEXT_PUBLIC_LOG_LEVEL`     | `LOG_LEVEL`                |
| **Runtime setLogLevel()** | No-op (not supported)       | Works                      |
| **Bundling**              | No external dependencies    | Uses Winston (server-only) |
| **File**                  | `logger-client.ts`          | `logger-server.ts`         |

### When to Use Which

- **Client Components** (React components, pages): Use `logger-client.ts`

  ```typescript
  import { logger } from "@/library/logger/client";
  ```

- **API Routes**: Use `logger-server.ts`

  ```typescript
  import { serverLogger as logger } from "@/library/logger/server";
  ```

- **Server Components**: Use `logger-server.ts`

  ```typescript
  import { serverLogger as logger } from "@/library/logger/server";
  ```

- **CLI Scripts**: Use `logger-server.ts`

  ```typescript
  import { serverLogger as logger } from "../../library/logger/server";
  ```

- **Shared Server Code**: Use `logger-server.ts`
  ```typescript
  import { serverLogger as logger } from "./logger-server";
  ```

### Why Two Separate Loggers?

Next.js/Turbopack analyzes all `require()` statements at build time, even when they're in conditionals. This means we can't have a unified `logger.ts` that conditionally imports Winston without bundling it in client code. The separate files ensure:

1. Winston is never bundled in client code
2. Client code uses lightweight console methods
3. Server code gets full Winston features
4. Same API for consistent developer experience

## Extending the Logger

### Adding New Context Loggers

To add a new context-specific logger, update both `source/library/logger/client.ts` and `source/library/logger/server.ts`:

**In both files:**

```typescript
const contextEmojiMap = {
  search: "🔍",
  success: "✅",
  stats: "📊",
  cost: "💰",
  start: "🚀",
  // Add your new context
  database: "💾",
};

// Export the new logger
export const logDatabase = contextLogger(contextEmojiMap.database);
```

### Adding Custom Transports (Server Only)

To add file logging or other transports to the server logger, update `source/library/logger/server.ts`:

```typescript
import winston from "winston";

export const serverLogger = winston.createLogger({
  // ... existing config
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({
      filename: "error.log",
      level: "error",
    }),
  ],
});
```

## Migration from console.log

When migrating existing code, choose the appropriate logger:

**Client Components:**

```typescript
// Before
console.log("Processing started");
console.error("Error:", error);
console.warn("Warning: deprecated feature");

// After
import { logger } from "@/library/logger/client";
logger.info("Processing started");
logger.error("Processing failed", { error });
logger.warn("Deprecated feature used");
```

**Server Code:**

```typescript
// Before
console.log("Processing started");
console.error("Error:", error);
console.warn("Warning: deprecated feature");

// After
import { serverLogger as logger } from "@/library/logger/server";
logger.info("Processing started");
logger.error("Processing failed", { error });
logger.warn("Deprecated feature used");
```

## API Reference

### Client Logger (`logger-client.ts`)

**Exported Functions:**

- `logger` - Main client logger instance (console-based)
- `logSearch(message, meta?)` - Search operations (🔍)
- `logSuccess(message, meta?)` - Success messages (✅)
- `logStats(message, meta?)` - Statistics (📊)
- `logCost(message, meta?)` - Cost information (💰)
- `logStart(message, meta?)` - Start operations (🚀)
- `setLogLevel(level: string)` - No-op (client log level is env-based only)

**Logger Methods:**

- `logger.error(message, meta?)` - Log error
- `logger.warn(message, meta?)` - Log warning
- `logger.info(message, meta?)` - Log info
- `logger.http(message, meta?)` - Log HTTP
- `logger.verbose(message, meta?)` - Log verbose
- `logger.debug(message, meta?)` - Log debug
- `logger.silly(message, meta?)` - Log silly
- `logger.log(level: string, message, meta?)` - Generic log method

### Server Logger (`logger-server.ts`)

**Exported Functions:**

- `serverLogger` - Main Winston logger instance
- `logSearch(message, meta?)` - Search operations (🔍)
- `logSuccess(message, meta?)` - Success messages (✅)
- `logStats(message, meta?)` - Statistics (📊)
- `logCost(message, meta?)` - Cost information (💰)
- `logStart(message, meta?)` - Start operations (🚀)
- `setLogLevel(level: string)` - Change log level at runtime

**Logger Methods:**

- `serverLogger.error(message, meta?)` - Log error
- `serverLogger.warn(message, meta?)` - Log warning
- `serverLogger.info(message, meta?)` - Log info
- `serverLogger.http(message, meta?)` - Log HTTP
- `serverLogger.verbose(message, meta?)` - Log verbose
- `serverLogger.debug(message, meta?)` - Log debug
- `serverLogger.silly(message, meta?)` - Log silly
- `serverLogger.log(level: string, message, meta?)` - Generic log method
