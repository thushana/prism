# Prism Glossary

Domain-specific terms, concepts, and abbreviations used in the Prism framework.

## Package

**Definition**: A shared library or module in the Prism monorepo that can be used across multiple apps.

**Context**: Packages live in `packages/` directory and are referenced via npm workspace file references. Examples: `ui`, `database`, `logger`, `cli`, `charts`, `authentication`, `intelligence`, `system-sheet`, `utilities`.

**Related**: App, Workspace, Monorepo

## App

**Definition**: A Next.js application generated from the Prism template, deployed independently.

**Context**: Apps live in `apps/` directory. Each app can reference Prism packages via workspace dependencies. The `apps/web` directory serves as the template.

**Related**: Package, Template, Generation

## Template

**Definition**: The base structure used when generating new apps (currently `apps/web`).

**Context**: When generating a new app, files are copied from the template and customized with the app name and selected packages.

**Related**: App, Generation

## Generation

**Definition**: The process of creating a new Prism app from a template using the CLI tool.

**Context**: Run via `npm run prism generate <app-name>`. Creates a new Next.js app with workspace references to Prism packages.

**Related**: Template, App, CLI Tool

## Workspace

**Definition**: An npm workspace configuration that allows multiple packages and apps to share dependencies and reference each other.

**Context**: Defined in root `package.json` with `workspaces` field. Enables local file references like `"ui": "file:./packages/ui"`.

**Related**: Package, Monorepo

## Monorepo

**Definition**: A repository structure that contains multiple related projects (packages and apps) in a single repository.

**Context**: Prism uses a monorepo to share code between apps while allowing independent deployment. Benefits include atomic commits and consistent versioning.

**Related**: Workspace, Package, App

## Local File Reference

**Definition**: An npm package dependency that points to a local directory using `file:./path` syntax.

**Context**: Used in app `package.json` files to reference Prism packages. Example: `"ui": "file:../../packages/ui"`.

**Related**: Package, Workspace

## Framework Package

**Definition**: A Prism package that provides framework-level functionality (UI components, database layer, logger, etc.).

**Context**: Framework packages are designed to be framework-agnostic where possible, allowing reuse across different app types. Located in `prism/packages/`.

**Related**: Package, App Package

## App Package

**Definition**: A package that contains app-specific code, as opposed to framework packages that are shared.

**Context**: In child apps (like TimeTraveler), app-specific packages may exist at the app root level, separate from Prism framework packages.

**Related**: Framework Package, Package

## CLI Tool

**Definition**: Command-line interface for Prism framework operations (generation, syncing, etc.).

**Context**: Located in `tools/` directory. Provides commands like `generate`, `sync`, and development workflow helpers.

**Related**: Generation, CLI Package

## CLI Package

**Definition**: The `packages/cli` package that provides shared CLI utilities, prompts, and styling.

**Context**: Used by both the Prism CLI tool (`tools/`) and child apps for consistent CLI experiences. Provides interactive prompts, styling utilities, and command patterns.

**Related**: CLI Tool, Package

## Child App

**Definition**: An application that uses Prism as a submodule or dependency, consuming Prism packages.

**Context**: Child apps reference Prism packages via local file references or npm links. They maintain their own app-specific code while leveraging Prism framework packages.

**Related**: App, Framework Package

## Submodule

**Definition**: A Git submodule that references the Prism repository from within a child app's repository.

**Context**: Allows child apps to track a specific version of Prism while maintaining separate repositories. The Prism directory appears as a submodule in child app repos.

**Related**: Child App, Monorepo

## Sync

**Definition**: The process of copying files, scripts, or commands from Prism to a child app to keep them in sync.

**Context**: Run via `npm run prism:sync` commands. Ensures child apps have the latest Prism tooling, scripts, or configuration without manual copying.

**Related**: CLI Tool, Child App

## System Sheet

**Definition**: A password-protected admin page that displays system information, health status, and diagnostics.

**Context**: Provided by the `system-sheet` package. Uses web authentication (`PRISM_KEY_WEB`) for access control.

**Related**: Authentication, Package

## Intelligence Package

**Definition**: The `packages/intelligence` package that provides AI model configuration and task registry.

**Context**: Centralizes AI model settings, provides task registration system, and manages model selection logic.

**Related**: Package, Task Registry

## Task Registry

**Definition**: A system for registering and discovering AI tasks within the Intelligence package.

**Context**: Allows tasks to be discovered and executed dynamically. Tasks are registered in the Intelligence package and can be invoked by name.

**Related**: Intelligence Package

## Charts Package

**Definition**: The `packages/charts` package that provides React chart components built on Nivo.

**Context**: Provides `BarChart` and `LineChart` components with automatic theme integration. Includes data transformation helpers for time series visualization.

**Related**: Package, UI Package

## UI Package

**Definition**: The `packages/ui` package that provides shared UI components and styling.

**Context**: Built with Radix UI primitives, uses Class Variance Authority for variants. Includes fonts (Satoshi, Sentient, Zodiak, Gambarino) and global styles.

**Related**: Package, Charts Package

## Logger Package

**Definition**: The `packages/logger` package that provides centralized logging with context-aware loggers.

**Context**: Provides server and client loggers with different log levels. Supports CLI mode for styled console output and structured logging for production.

**Related**: Package, CLI Package

## Database Package

**Definition**: The `packages/database` package that provides the shared database layer with Drizzle ORM.

**Context**: Contains database schema, queries, and Drizzle configuration. Uses Neon PostgreSQL for both development and production.

**Related**: Package, Framework Package

## Authentication Package

**Definition**: The `packages/authentication` package that provides authentication utilities for API and web routes.

**Context**: Supports API authentication via `PRISM_KEY_API` header and web authentication via `PRISM_KEY_WEB` cookie. Used for protecting admin routes and pages.

**Related**: Package, System Sheet
