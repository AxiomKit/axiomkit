#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const {
  loadVersionConfig,
  updatePackageVersion,
} = require("./version-manager");

// --- Configuration ---
const PACKAGES_DIR = "./packages";

// --- Args ---
const packageName = process.argv[2];
if (!packageName) {
  console.error("Usage: pnpm publish:enhanced <package-name> [options]");
  console.error("Options:");
  console.error("  --dry-run              Dry run mode");
  console.error("  --bump <type>          Bump version before publishing");
  console.error("  --version <version>    Set specific version");
  console.error("  --skip-build           Skip build step");
  console.error("  --skip-tests           Skip test step");
  process.exit(1);
}

const options = {
  dryRun: process.argv.includes("--dry-run"),
  bump: process.argv.includes("--bump")
    ? process.argv[process.argv.indexOf("--bump") + 1]
    : null,
  version: process.argv.includes("--version")
    ? process.argv[process.argv.indexOf("--version") + 1]
    : null,
  skipBuild: process.argv.includes("--skip-build"),
  skipTests: process.argv.includes("--skip-tests"),
};

const pkgDir = path.join(PACKAGES_DIR, packageName.replace("@axiomkit/", ""));

// --- Validation ---
if (!fs.existsSync(pkgDir)) {
  console.error(`❌ Package "${packageName}" not found in ${PACKAGES_DIR}/`);
  process.exit(1);
}

// --- Load Configuration ---
const config = loadVersionConfig();

// --- Utility Functions ---
function readPackageJson(packagePath) {
  const packageJsonPath = path.join(packagePath, "package.json");
  return JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
}

function writePackageJson(packagePath, packageJson) {
  const packageJsonPath = path.join(packagePath, "package.json");
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
}

function validateVersion(version) {
  const semverRegex =
    /^\d+\.\d+\.\d+(-[0-9A-Za-z-]+(\.[0-9A-Za-z-]+)*)?(\+[0-9A-Za-z-]+(\.[0-9A-Za-z-]+)*)?$/;
  return semverRegex.test(version);
}

function checkGitStatus() {
  try {
    const status = execSync("git status --porcelain", { encoding: "utf8" });
    if (status.trim()) {
      console.warn("⚠️  Warning: You have uncommitted changes");
      console.log(status);
      return false;
    }
    return true;
  } catch (error) {
    console.warn("⚠️  Warning: Could not check git status");
    return true;
  }
}

function runTests(packageName) {
  console.log(`🧪 Running tests for ${packageName}...`);
  try {
    execSync(`pnpm --filter ${packageName} run test`, {
      stdio: "inherit",
    });
    console.log("✅ Tests passed");
    return true;
  } catch (error) {
    console.error("❌ Tests failed");
    return false;
  }
}

function buildPackage(packageName) {
  console.log(`🔨 Building ${packageName}...`);
  try {
    // First, ensure catalog dependencies are up to date
    console.log("📦 Syncing catalog dependencies...");
    execSync("pnpm install", { stdio: "inherit" });

    // Then build the package
    execSync(`pnpm --filter ${packageName} run build`, {
      stdio: "inherit",
    });
    console.log("✅ Build successful");
    return true;
  } catch (error) {
    console.error("❌ Build failed");
    return false;
  }
}

function updateVersion(packageName, versionType) {
  console.log(`📦 Updating version for ${packageName}...`);
  try {
    const newVersion = updatePackageVersion(packageName, versionType, config);
    console.log(`✅ Version updated to ${newVersion}`);

    // Auto-update catalog versions if enabled
    if (config.catalogManagement?.updateCatalogOnPublish) {
      const { autoUpdateCatalogOnPublish } = require("./version-manager");
      autoUpdateCatalogOnPublish(packageName, newVersion, config);
    }

    return newVersion;
  } catch (error) {
    console.error(`❌ Failed to update version: ${error.message}`);
    return null;
  }
}

function setSpecificVersion(packageName, version) {
  console.log(`📦 Setting version for ${packageName} to ${version}...`);

  if (!validateVersion(version)) {
    console.error(`❌ Invalid version format: ${version}`);
    return null;
  }

  try {
    const packagePath = path.join(
      PACKAGES_DIR,
      packageName.replace("@axiomkit/", "")
    );
    const packageJson = readPackageJson(packagePath);
    const oldVersion = packageJson.version;

    packageJson.version = version;
    writePackageJson(packagePath, packageJson);

    // Update config
    if (config.packages[packageName]) {
      config.packages[packageName].version = version;
    }

    console.log(`✅ Version updated from ${oldVersion} to ${version}`);
    return version;
  } catch (error) {
    console.error(`❌ Failed to set version: ${error.message}`);
    return null;
  }
}

function publishPackage(packageName, dryRun = false) {
  console.log(`🚀 Publishing ${packageName}...`);

  const publishCommand = `pnpm --filter ${packageName} publish --no-git-checks${
    dryRun ? " --dry-run" : ""
  }`;

  try {
    execSync(publishCommand, { stdio: "inherit" });
    console.log(`✅ Successfully published ${packageName}!`);
    return true;
  } catch (error) {
    console.error(`❌ Publish failed for ${packageName}: ${error.message}`);
    return false;
  }
}

function createGitTag(packageName, version) {
  const tagName = `${packageName}@${version}`;
  console.log(`🏷️  Creating git tag: ${tagName}`);

  try {
    execSync(`git tag ${tagName}`, { stdio: "inherit" });
    console.log(`✅ Git tag created: ${tagName}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to create git tag: ${error.message}`);
    return false;
  }
}

// --- Main Execution ---
async function main() {
  console.log(`🚀 Enhanced Publishing for ${packageName}`);
  console.log("=".repeat(50));

  // Check git status
  if (!options.dryRun) {
    checkGitStatus();
  }

  // Version management
  let finalVersion = null;

  if (options.version) {
    finalVersion = setSpecificVersion(packageName, options.version);
    if (!finalVersion) {
      process.exit(1);
    }
  } else if (options.bump) {
    finalVersion = updateVersion(packageName, options.bump);
    if (!finalVersion) {
      process.exit(1);
    }
  }

  // Run tests (unless skipped)
  if (!options.skipTests) {
    if (!runTests(packageName)) {
      console.error("❌ Publishing aborted due to test failures");
      process.exit(1);
    }
  }

  // Build package (unless skipped)
  if (!options.skipBuild) {
    if (!buildPackage(packageName)) {
      console.error("❌ Publishing aborted due to build failures");
      process.exit(1);
    }
  }

  // Publish package
  if (!publishPackage(packageName, options.dryRun)) {
    process.exit(1);
  }

  // Create git tag (if not dry run)
  if (!options.dryRun && finalVersion) {
    createGitTag(packageName, finalVersion);
  }

  // Save configuration and sync catalog
  try {
    const { saveVersionConfig } = require("./version-manager");
    saveVersionConfig(config);

    // Sync catalog dependencies after publishing
    console.log("📦 Syncing catalog dependencies after publish...");
    execSync("pnpm install", { stdio: "inherit" });
  } catch (error) {
    console.warn("⚠️  Warning: Could not save version configuration");
  }

  console.log("\n🎉 Publishing completed successfully!");

  if (options.dryRun) {
    console.log("📝 This was a dry run - no actual publishing occurred");
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(`❌ Unexpected error: ${error.message}`);
    process.exit(1);
  });
}
