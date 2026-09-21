#!/usr/bin/env node
require("./eslint-typescript6-hook.cjs");

const path = require("node:path");

const eslintBin = path.join(
  path.dirname(require.resolve("eslint/package.json")),
  "bin",
  "eslint.js"
);

process.argv.splice(1, 1, eslintBin);
require(eslintBin);
