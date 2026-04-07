# Logger Documentation

> **Status**: ✅ **Implemented** - Centralized logging infrastructure is available in `packages/logger`.

## Overview

The application uses separate loggers for client and server code to prevent bundling issues. Both loggers provide the same API for consistent developer experience:

- **Client-side**: `packages/logger/source/client.ts` - Uses browser `console.*` methods
- **Server-side**: `packages/logger/source/server.ts` - Uses **Winston** for Node.js logging

Both loggers support emoji-prefixed messages for better readability and context. All logging should go through these logger instances to ensure consistency across the codebase.

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
import { logger } from "@logger/client";

// Standard log levels
logger.error("Operation failed", { error });
logger.warn("Deprecated feature used");
logger.info("Processing started");
logger.debug("Debug information", { data });
```

### Server-Side Logging

For server code (API routes, server components, CLI scripts):

```typescript
import { serverLogger as logger } from "@logger/server";

// Standard log levels
logger.error("Operation failed", { error });
logger.warn("Deprecated feature used");
logger.info("Processing started");
logger.debug("Debug information", { data });
```

**Note**: You can alias `serverLogger` to `logger` for consistency:

```typescript
import { serverLogger as logger } from "@logger/server";
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
} from "@logger/client";

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
} from "@logger/server";

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
import { setLogLevel } from "@logger/server";

setLogLevel("debug"); // Enable debug logging
setLogLevel("error"); // Only show errors
```

**Note**: Client-side `setLogLevel()` is a no-op. Client log levels are determined by environment variables only. The client logger does not expose a `level` property.

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

### Default Mode (Server/api Routes)

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

### CLI Mode (CLI Applications)

When CLI mode is enabled via `setCLIMode(true)`, output is cleaner without timestamps and log levels:

```
[EMOJI] message [metadata]
```

Example:

```
🔍 Searching for places... {"count": 10}
✅ Found 5 places
❌ Operation failed {"error": "Connection timeout"}
```

**When to use CLI mode:**

- All CLI applications should use CLI mode for cleaner, more readable output
- Enable it at the CLI entry point: `setCLIMode(true)`
- See `prism/docs/CLI-Prism.md` for complete CLI mode documentation

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
| **File**                  | `client.ts`                 | `server.ts`                |

### When to Use Which

- **Client Components** (React components, pages): Use `@logger/client`

  ```typescript
  import { logger } from "@logger/client";
  ```

- **API Routes**: Use `@logger/server`

  ```typescript
  import { serverLogger as logger } from "@logger/server";
  ```

- **Server Components**: Use `@logger/server`

  ```typescript
  import { serverLogger as logger } from "@logger/server";
  ```

- **CLI Scripts**: Use `@logger/server` with **CLI mode enabled**

  ```typescript
  import { serverLogger as logger, setCLIMode } from "@logger/server";

  // Enable CLI mode for cleaner output (no timestamps/log levels)
  setCLIMode(true);

  // Now all logger output will be clean
  logger.info("Processing..."); // Shows: "Processing..." instead of "2024-01-15 10:30:45 ℹ️ [INFO] Processing..."
  ```

  **Important**: All CLI applications should enable CLI mode at their entry point. See `prism/docs/CLI-Prism.md` for more details.

- **Shared Server Code**: Use `@logger/server`
  ```typescript
  import { serverLogger as logger } from "@logger/server";
  ```

### Why Two Separate Loggers?

Next.js/Turbopack analyzes all `require()` statements at build time, even when they're in conditionals. This means we can't have a unified `logger.ts` that conditionally imports Winston without bundling it in client code. The separate files ensure:

1. Winston is never bundled in client code
2. Client code uses lightweight console methods
3. Server code gets full Winston features
4. Same API for consistent developer experience

## Extending the Logger

### Adding New Context Loggers

To add a new context-specific logger, update both `packages/logger/source/client.ts` and `packages/logger/source/server.ts`:

**Note**: The actual file paths are `client.ts` and `server.ts` in the `source` directory, not `logger-client.ts` or `logger-server.ts`.

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

To add file logging or other transports to the server logger, update `packages/logger/source/server.ts`:

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

## Migration from Console.log

When migrating existing code, choose the appropriate logger:

**Client Components:**

```typescript
// Before
console.log("Processing started");
console.error("Error:", error);
console.warn("Warning: deprecated feature");

// After
import { logger } from "@logger/client";
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
import { serverLogger as logger } from "@logger/server";
logger.info("Processing started");
logger.error("Processing failed", { error });
logger.warn("Deprecated feature used");
```

## API Reference

### Client Logger (`client.ts`)

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

### Server Logger (`server.ts`)

**Note**: The server logger also exports `logger` as an alias for `serverLogger` for convenience:

```typescript
import { logger } from "@logger/server"; // Same as serverLogger
```

**Exported Functions:**

- `serverLogger` - Main Winston logger instance
- `logSearch(message, meta?)` - Search operations (🔍)
- `logSuccess(message, meta?)` - Success messages (✅)
- `logStats(message, meta?)` - Statistics (📊)
- `logCost(message, meta?)` - Cost information (💰)
- `logStart(message, meta?)` - Start operations (🚀)
- `setLogLevel(level: string)` - Change log level at runtime
- `setCLIMode(enabled: boolean)` - Enable/disable CLI mode (removes timestamps/log levels for cleaner CLI output)

**Logger Methods:**

- `serverLogger.error(message, meta?)` - Log error
- `serverLogger.warn(message, meta?)` - Log warning
- `serverLogger.info(message, meta?)` - Log info
- `serverLogger.http(message, meta?)` - Log HTTP
- `serverLogger.verbose(message, meta?)` - Log verbose
- `serverLogger.debug(message, meta?)` - Log debug
- `serverLogger.silly(message, meta?)` - Log silly
- `serverLogger.log(level: string, message, meta?)` - Generic log method
