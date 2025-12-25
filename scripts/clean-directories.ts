#!/usr/bin/env tsx

/**
 * Script to remove all empty directories in the project
 * Excludes node_modules, .git, .next, and other build/cache directories
 */

import fs from 'fs';
import path from 'path';

// Directories to exclude from cleaning
const EXCLUDED_DIRS = new Set([
  'node_modules',
  '.git',
  '.next',
  '.vercel',
  'dist',
  'build',
  '.cache',
  '.turbo',
  'coverage',
  '.nyc_output',
  '.vscode',
  '.idea',
  'migrations', // Keep database migrations directory structure
]);

// Files/directories to always ignore
const IGNORED_PATTERNS = [
  /^\.git$/,
  /^node_modules$/,
  /^\.next$/,
  /^\.vercel$/,
  /^dist$/,
  /^build$/,
  /^\.cache$/,
  /^\.turbo$/,
  /^coverage$/,
  /^\.nyc_output$/,
];

/**
 * Check if a directory is empty (no files or subdirectories)
 */
function isEmptyDir(dirPath: string): boolean {
  try {
    const entries = fs.readdirSync(dirPath);
    return entries.length === 0;
  } catch (error) {
    // If we can't read the directory, consider it non-empty to be safe
    return false;
  }
}

/**
 * Check if a directory should be excluded
 */
function shouldExclude(dirName: string): boolean {
  return EXCLUDED_DIRS.has(dirName) || IGNORED_PATTERNS.some(pattern => pattern.test(dirName));
}

/**
 * Recursively find and remove empty directories
 * Returns the number of directories removed
 */
function removeEmptyDirs(dirPath: string, rootPath: string = dirPath): number {
  let removedCount = 0;

  try {
    const entries = fs.readdirSync(dirPath);

    // First, recursively process subdirectories
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry);
      
      try {
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          // Skip excluded directories
          if (shouldExclude(entry)) {
            continue;
          }
          
          // Recursively process subdirectory
          removedCount += removeEmptyDirs(fullPath, rootPath);
        }
      } catch (error) {
        // Skip entries we can't access
        continue;
      }
    }

    // After processing subdirectories, check if this directory is now empty
    if (isEmptyDir(dirPath)) {
      // Don't remove the root directory
      if (dirPath !== rootPath) {
        try {
          fs.rmdirSync(dirPath);
          console.log(`Removed empty directory: ${path.relative(process.cwd(), dirPath)}`);
          removedCount++;
        } catch (error) {
          // If removal fails, directory might not be empty or we don't have permission
          // This is fine, just continue
        }
      }
    }
  } catch (error) {
    // If we can't read the directory, skip it
    return 0;
  }

  return removedCount;
}

// Main execution
const projectRoot = process.cwd();
console.log(`Cleaning empty directories in: ${projectRoot}\n`);

const removedCount = removeEmptyDirs(projectRoot);

if (removedCount === 0) {
  console.log('\n✓ No empty directories found');
} else {
  console.log(`\n✓ Removed ${removedCount} empty director${removedCount === 1 ? 'y' : 'ies'}`);
}

process.exit(0);

