#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// --- Config ---
const PACKAGES_DIR = "./packages";

// --- Args ---
const packageName = process.argv[2];
if (!packageName) {
  console.error("Usage: pnpm publish:package <package-name> [--dry-run]");
  process.exit(1);
}

const dryRun = process.argv.includes("--dry-run");
const pkgDir = path.join(PACKAGES_DIR, packageName);

// --- Validate ---
if (!fs.existsSync(pkgDir)) {
  console.error(`❌ Package "${packageName}" not found in ${PACKAGES_DIR}/`);
  process.exit(1);
}

// --- Steps ---
console.log(`🚀 Building and publishing ${packageName}...`);

// 1. Build the package
execSync(`pnpm --filter @axiomkit/${packageName} run build`, {
  stdio: "inherit",
});

try {
  execSync(
    `pnpm --filter @axiomkit/${packageName} publish --no-git-checks${
      dryRun ? " --dry-run" : ""
    }`,
    { stdio: "inherit" }
  );
  console.log(`✅ Successfully published ${packageName}!`);
} catch (error) {
  console.error(`❌ Publish failed for ${packageName}:`, error.message);
  process.exit(1);
}
