#!/usr/bin/env node

/**
 * CLI Entry Point
 * 
 * Add your CLI commands here for local maintenance and tasks.
 */

import { Command } from "commander";

const program = new Command();

program
  .name("cli")
  .description("CLI tools for {{APP_NAME}}")
  .version("0.1.0");

program
  .command("example")
  .description("Example command")
  .action(() => {
    console.log("Hello from {{APP_NAME}} CLI!");
  });

program.parse(process.argv);

