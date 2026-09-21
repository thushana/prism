/**
 * Route `require("typescript")` to @typescript/typescript6 for ESLint until
 * typescript-eslint supports the TS 7 compiler API.
 */
const Module = require("module");
const path = require("path");

const typescript6Entry = require.resolve("@typescript/typescript6");
const originalResolveFilename = Module._resolveFilename;

Module._resolveFilename = function (request, parent, isMain, options) {
  if (request === "typescript") {
    return typescript6Entry;
  }
  if (request.startsWith("typescript/")) {
    const subpath = request.slice("typescript/".length);
    return path.join(path.dirname(typescript6Entry), subpath);
  }
  return originalResolveFilename.call(this, request, parent, isMain, options);
};
