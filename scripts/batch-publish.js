#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const {
  loadVersionConfig,
  updateAllPackages,
  saveVersionConfig,
} = require("./version-manager");

// --- Configuration ---
const PACKAGES_DIR = "./packages";

// --- Args ---
const args = process.argv.slice(2);
const command = args[0];

if (!command) {
  console.error("Usage: pnpm batch:publish <command> [options]");
  console.error("Commands:");
  console.error("  all [--bump <type>] [--dry-run]     Publish all packages");
  console.error(
    "  packages <pkg1,pkg2,...> [options]   Publish specific packages"
  );
  console.error(
    "  changed [--bump <type>] [--dry-run]  Publish only changed packages"
  );
  console.error("Options:");
  console.error(
    "  --bump <type>                        Bump version before publishing"
  );
  console.error("  --dry-run                            Dry run mode");
  console.error("  --skip-tests                         Skip test step");
  console.error("  --skip-build                         Skip build step");
  console.error(
    "  --parallel                           Publish packages in parallel"
  );
  process.exit(1);
}

const options = {
  dryRun: args.includes("--dry-run"),
  bump: args.includes("--bump") ? args[args.indexOf("--bump") + 1] : null,
  skipTests: args.includes("--skip-tests"),
  skipBuild: args.includes("--skip-build"),
  parallel: args.includes("--parallel"),
};

// --- Utility Functions ---
function getPackageList() {
  const packages = [];
  const packageDirs = fs.readdirSync(PACKAGES_DIR, { withFileTypes: true });

  for (const dir of packageDirs) {
    if (dir.isDirectory() && !dir.name.startsWith(".")) {
      const packageJsonPath = path.join(PACKAGES_DIR, dir.name, "package.json");
      if (fs.existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(
          fs.readFileSync(packageJsonPath, "utf8")
        );
        packages.push({
          name: packageJson.name,
          path: path.join(PACKAGES_DIR, dir.name),
          version: packageJson.version,
        });
      }
    }
  }

  return packages;
}

function getChangedPackages() {
  try {
    // Get list of changed files
    const changedFiles = execSync("git diff --name-only HEAD~1", {
      encoding: "utf8",
    })
      .split("\n")
      .filter((file) => file.trim());

    const packages = getPackageList();
    const changedPackages = [];

    for (const pkg of packages) {
      const packageDir = pkg.name.replace("@axiomkit/", "");
      const hasChanges = changedFiles.some(
        (file) =>
          file.startsWith(`packages/${packageDir}/`) ||
          file.startsWith(`examples/`) ||
          file.includes("package.json")
      );

      if (hasChanges) {
        changedPackages.push(pkg);
      }
    }

    return changedPackages;
  } catch (error) {
    console.warn("⚠️  Could not determine changed packages, publishing all");
    return getPackageList();
  }
}

function validatePackages(packageNames) {
  const allPackages = getPackageList();
  const validPackages = [];
  const invalidPackages = [];

  for (const packageName of packageNames) {
    const found = allPackages.find((pkg) => pkg.name === packageName);
    if (found) {
      validPackages.push(found);
    } else {
      invalidPackages.push(packageName);
    }
  }

  if (invalidPackages.length > 0) {
    console.error(`❌ Invalid packages: ${invalidPackages.join(", ")}`);
    console.error("Available packages:");
    allPackages.forEach((pkg) => console.error(`  - ${pkg.name}`));
    process.exit(1);
  }

  return validPackages;
}

function runTests(packageName) {
  console.log(`🧪 Running tests for ${packageName}...`);
  try {
    execSync(`pnpm --filter ${packageName} run test`, {
      stdio: "inherit",
    });
    return true;
  } catch (error) {
    console.error(`❌ Tests failed for ${packageName}`);
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
    return true;
  } catch (error) {
    console.error(`❌ Build failed for ${packageName}`);
    return false;
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

function publishPackagesSequentially(packages, options) {
  const results = [];

  for (const pkg of packages) {
    console.log(`\n📦 Processing ${pkg.name} (${pkg.version})`);
    console.log("=".repeat(50));

    // Run tests
    if (!options.skipTests) {
      if (!runTests(pkg.name)) {
        console.error(`❌ Skipping ${pkg.name} due to test failures`);
        results.push({
          package: pkg.name,
          success: false,
          reason: "tests_failed",
        });
        continue;
      }
    }

    // Build package
    if (!options.skipBuild) {
      if (!buildPackage(pkg.name)) {
        console.error(`❌ Skipping ${pkg.name} due to build failures`);
        results.push({
          package: pkg.name,
          success: false,
          reason: "build_failed",
        });
        continue;
      }
    }

    // Publish package
    const success = publishPackage(pkg.name, options.dryRun);
    results.push({
      package: pkg.name,
      success,
      reason: success ? "published" : "publish_failed",
    });
  }

  return results;
}

function publishPackagesParallel(packages, options) {
  console.log("⚠️  Parallel publishing is not yet implemented");
  console.log("Falling back to sequential publishing...");
  return publishPackagesSequentially(packages, options);
}

// --- Main Functions ---
function publishAll(options) {
  console.log("🚀 Publishing all packages...");

  const packages = getPackageList();
  console.log(`📦 Found ${packages.length} packages to publish`);

  if (options.bump) {
    console.log(`📈 Bumping all packages with ${options.bump} version`);
    const config = loadVersionConfig();
    updateAllPackages(options.bump, config);
    saveVersionConfig(config);
  }

  const results = options.parallel
    ? publishPackagesParallel(packages, options)
    : publishPackagesSequentially(packages, options);

  return results;
}

function publishSpecific(packageNames, options) {
  console.log(`🚀 Publishing specific packages: ${packageNames.join(", ")}`);

  const packages = validatePackages(packageNames);
  console.log(`📦 Found ${packages.length} valid packages to publish`);

  const results = options.parallel
    ? publishPackagesParallel(packages, options)
    : publishPackagesSequentially(packages, options);

  return results;
}

function publishChanged(options) {
  console.log("🚀 Publishing changed packages...");

  const packages = getChangedPackages();
  console.log(`📦 Found ${packages.length} changed packages to publish`);

  if (packages.length === 0) {
    console.log("ℹ️  No packages have changed since last commit");
    return [];
  }

  if (options.bump) {
    console.log(`📈 Bumping changed packages with ${options.bump} version`);
    const config = loadVersionConfig();

    for (const pkg of packages) {
      try {
        const { updatePackageVersion } = require("./version-manager");
        updatePackageVersion(pkg.name, options.bump, config);
      } catch (error) {
        console.error(
          `❌ Failed to bump version for ${pkg.name}: ${error.message}`
        );
      }
    }
    saveVersionConfig(config);
  }

  const results = options.parallel
    ? publishPackagesParallel(packages, options)
    : publishPackagesSequentially(packages, options);

  return results;
}

function printResults(results) {
  console.log("\n📊 Publishing Results:");
  console.log("=".repeat(50));

  const successful = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);

  console.log(`✅ Successful: ${successful.length}`);
  successful.forEach((r) => console.log(`  - ${r.package}`));

  if (failed.length > 0) {
    console.log(`❌ Failed: ${failed.length}`);
    failed.forEach((r) => console.log(`  - ${r.package} (${r.reason})`));
  }

  console.log(
    `\n📈 Success Rate: ${Math.round(
      (successful.length / results.length) * 100
    )}%`
  );
}

// --- Main Execution ---
function main() {
  let results = [];

  try {
    switch (command) {
      case "all":
        results = publishAll(options);
        break;

      case "packages":
        if (args.length < 2) {
          console.error("❌ Usage: packages <pkg1,pkg2,...>");
          process.exit(1);
        }
        const packageNames = args[1].split(",").map((name) => name.trim());
        results = publishSpecific(packageNames, options);
        break;

      case "changed":
        results = publishChanged(options);
        break;

      default:
        console.error(`❌ Unknown command: ${command}`);
        process.exit(1);
    }

    printResults(results);

    if (results.some((r) => !r.success)) {
      process.exit(1);
    }
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
