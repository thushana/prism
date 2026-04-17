/**
 * Authentication package — client-safe entry.
 * Import server-only helpers from subpaths (e.g. `@authentication/web`, `@authentication/api`)
 * so `"use client"` modules can import UI from `@authentication` without pulling `server-only`.
 */

export * from "./core";
export * from "./password-form";
export * from "./admin-layout";
export * from "./sign-out-form";
