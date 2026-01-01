/**
 * Styling command - Display style sheet of available CLI styling utilities
 */

import { Command } from "commander";
import type { BaseCommandOptions } from "../../../packages/cli/source/command";
import chalk from "chalk";
import { styles, statusMessage, colors, colorNames, materialColors } from "../../../packages/cli/source/styling";
// TODO: Fix tsx ESM resolution issue - revert to @logger/server when fixed
// Workaround: Use namespace import due to tsx bug with package.json exports
import * as LoggerModule from "../../../packages/logger/source/server";
const serverLogger = LoggerModule.serverLogger;

const logger = serverLogger || console;

/**
 * Run styling command to display style sheet
 */
export async function runStylingCommand(
  options: BaseCommandOptions = {}
): Promise<void> {
  if (options.debug || options.verbose) {
    logger.level = "debug";
  }

  logger.info(chalk.bold.cyan("\n📋 ") + chalk.bold("💎 Prism") + chalk.bold.cyan(" CLI Style Sheet\n"));
  logger.info(chalk.dim("=".repeat(60)));

  // All Material UI Colors (in order from materialui.co/colors)
  logger.info(chalk.bold("\nMaterial UI Colors (50, 600, 900 variants):"));
  logger.info("");
  
  for (const colorName of colorNames) {
    const color = colors[colorName];
    const hex = materialColors[colorName];
    const displayName = colorName.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase());
    
    // Color name in default color, no colon
    logger.info(`  ${color.default.bold(displayName)}`);
    
    // Create color samples - all 3 characters wide visually (matching block width)
    // Light: pure background color (3 spaces for solid color box)
    // Default and dark: "███" format (3 blocks)
    const lightSample = chalk.bgHex(hex[50])("   ");
    const defaultSample = color.default("███");
    const darkSample = color.dark("███");
    
    // Column-aligned output: sample, mode (bold + colored), padded number, hex (in color)
    // Light variant: use light color on dark background to make it visible
    // Default and dark: use their respective colors
    logger.info(`    ${lightSample}  ${color.light.bgBlack.bold("light")}    ${color.light.bgBlack("50".padStart(3))}  ${color.light.bgBlack(hex[50])}`);
    logger.info(`    ${defaultSample}  ${color.default.bold("default")}  ${color.default("600".padStart(3))}  ${color.default(hex[600])}`);
    logger.info(`    ${darkSample}  ${color.dark.bold("dark")}     ${color.dark("900".padStart(3))}  ${color.dark(hex[900])}`);
    logger.info("");
  }

  // Status Colors (Material UI 600)
  logger.info(chalk.bold("Status Colors (Material UI 600):"));
  logger.info(`  ${styles.success("success")}  ${chalk.dim("Green #43A047")} - Success messages`);
  logger.info(`  ${styles.error("error")}  ${chalk.dim("Red #E53935")} - Error messages`);
  logger.info(`  ${styles.warning("warning")}  ${chalk.dim("Amber #FFB300")} - Warning messages`);
  logger.info(`  ${styles.info("info")}  ${chalk.dim("Blue #1E88E5")} - Info messages`);

  // Text Styles
  logger.info(chalk.bold("\nText Styles:"));
  logger.info(`  ${styles.bold("bold")} - Bold text`);
  logger.info(`  ${styles.dim("dim")} - Dimmed text`);
  logger.info(`  ${styles.italic("italic")} - Italic text`);
  logger.info(`  ${styles.underline("underline")} - Underlined text`);

  // Combined Styles
  logger.info(chalk.bold("\nCombined Styles:"));
  logger.info(`  ${styles.successBold("successBold")} - Success + Bold`);
  logger.info(`  ${styles.errorBold("errorBold")} - Error + Bold`);
  logger.info(`  ${styles.warningBold("warningBold")} - Warning + Bold`);
  logger.info(`  ${styles.infoBold("infoBold")} - Info + Bold`);

  // Pre-styled Symbols (using emojis)
  logger.info(chalk.bold("\nPre-styled Symbols:"));
  // Use tab separator for consistent column alignment
  logger.info(`  ${styles.checkmark}\tCheckmark (success)`);
  logger.info(`  ${styles.cross}\tCross (error)`);
  logger.info(`  ${styles.warningSymbol}\tWarning symbol`);
  logger.info(`  ${styles.infoSymbol}\tInfo symbol`);
  logger.info(`  ${styles.arrow}\tArrow symbol`);

  // Status Messages (using emojis)
  logger.info(chalk.bold("\nStatus Messages:"));
  logger.info(`  ${statusMessage("success", "Success message example")}`);
  logger.info(`  ${statusMessage("error", "Error message example")}`);
  logger.info(`  ${statusMessage("warning", "Warning message example")}`);
  logger.info(`  ${statusMessage("info", "Info message example")}`);

  // Direct Chalk Examples
  logger.info(chalk.bold("\nDirect Chalk Usage:"));
  logger.info(`  ${chalk.green("chalk.green()")} - Green text`);
  logger.info(`  ${chalk.red.bold("chalk.red.bold()")} - Red bold text`);
  logger.info(`  ${chalk.cyan.underline("chalk.cyan.underline()")} - Cyan underlined`);
  logger.info(`  ${chalk.magenta.dim("chalk.magenta.dim()")} - Magenta dimmed`);
  logger.info(`  ${chalk.yellow.bgBlack("chalk.yellow.bgBlack()")} - Yellow on black`);

  // Progress Bars
  logger.info(chalk.bold("\nProgress Bars:"));
  logger.info("");
  
  // Show visual progress bar examples
  const barLength = 30;
  
  // Example 1: 25% progress
  const filled25 = Math.round((25 / 100) * barLength);
  const bar25 = colors.blue.default("█".repeat(filled25)) + chalk.dim("░".repeat(barLength - filled25));
  logger.info(`  ${bar25} 25/100 (25.0%)`);
  
  // Example 2: 50% progress
  const filled50 = Math.round((50 / 100) * barLength);
  const bar50 = colors.cyan.default("█".repeat(filled50)) + chalk.dim("░".repeat(barLength - filled50));
  logger.info(`  ${bar50} 50/100 (50.0%)`);
  
  // Example 3: 75% progress
  const filled75 = Math.round((75 / 100) * barLength);
  const bar75 = colors.amber.default("█".repeat(filled75)) + chalk.dim("░".repeat(barLength - filled75));
  logger.info(`  ${bar75} 75/100 (75.0%)`);
  
  // Example 4: 100% complete
  const bar100 = colors.green.default("█".repeat(barLength));
  logger.info(`  ${bar100} 100/100 (100.0%) ${styles.checkmark}`);
  
  logger.info("");

  // Inquirer Prompts
  logger.info(chalk.bold("\nInquirer Prompts:"));
  logger.info("");
  
  // Single select (list) example
  logger.info(chalk.dim("  ? Choose an option:"));
  logger.info(`    ${colors.blue.default("❯")} Option 1`);
  logger.info(`    ${chalk.dim("  Option 2")}`);
  logger.info(`    ${chalk.dim("  Option 3")}`);
  logger.info("");
  
  // Multi-select (checkbox) example
  logger.info(chalk.dim("  ? Select items: (Press <space> to select, <a> to toggle all)"));
  logger.info(`    ${colors.green.default("◉")} Item 1`);
  logger.info(`    ${colors.green.default("◉")} Item 2`);
  logger.info(`    ${chalk.dim("○")} Item 3`);
  logger.info("");
  
  // Confirmation (yes/no) example
  logger.info(chalk.dim("  ? Continue?"));
  logger.info(`    ${colors.green.default("Yes")} ${chalk.dim("/ No")}`);
  logger.info("");
  
  // Text input example
  logger.info(chalk.dim("  ? Enter name:"));
  logger.info(`    ${colors.cyan.default("Bruce Wayne")}`);
  logger.info("");
  
  // Password input example
  logger.info(chalk.dim("  ? Enter password:"));
  logger.info(`    ${"*".repeat(8)} ${chalk.dim("(hidden)")}`);
  logger.info("");
  
  // Number input example
  logger.info(chalk.dim("  ? Enter count: (1-100)"));
  logger.info(`    ${colors.cyan.default("42")}`);

  logger.info(chalk.dim("\n" + "=".repeat(60)));
  logger.info(chalk.dim("\nSee prism/docs/CLI-Prism.md for full documentation.\n"));
}

/**
 * Register styling command
 */
export function registerStylingCommand(program: Command): void {
  program
    .command("styling")
    .description("Display style sheet of available CLI styling utilities")
    .option("--debug", "Enable debug logging", false)
    .option("--verbose", "Enable verbose logging", false)
    .action(async (options: BaseCommandOptions) => {
      try {
        await runStylingCommand(options);
      } catch (error) {
        if (logger) {
          logger.error("Styling command failed", { error });
        } else {
          console.error("Styling command failed:", error);
        }
        process.exit(1);
      }
    });
}
