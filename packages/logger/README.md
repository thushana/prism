# Logger Package

Centralized logging infrastructure with separate client and server loggers.

## Quick Start

```typescript
// Client-side (React components)
import { logger, logSuccess } from "@logger/client";
logger.info("Component mounted");
logSuccess("Data loaded");

// Server-side (API routes, server components)
import { serverLogger as logger, logSearch } from "@logger/server";
logger.error("Operation failed", { error });
logSearch("Querying database");
```

## Package Structure

- `source/client.ts` - Browser console wrapper
- `source/server.ts` - Winston-based Node.js logger
- `source/index.ts` - Re-exports

## Testing

```bash
npm run test        # Watch mode
npm run test:run    # Single run
npm run test:coverage  # With coverage
```

## Documentation

For complete documentation, see [docs/LOGGER.md](../../docs/LOGGER.md).
