#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const yaml = require("yaml");
const { execSync } = require("child_process");

// --- Config ---
const WORKSPACE_YML = "./pnpm-workspace.yaml";
const PACKAGES_DIR = "./packages"; // Change if needed

// --- Args ---
const targetPackage = process.argv[2]; // e.g. "core" or "plugin-sei"
if (!targetPackage) {
  console.error("Usage: pnpm publish-package <package-name> [--dry-run]");
  process.exit(1);
}

const dryRun = process.argv.includes("--dry-run");

// --- Main ---
(async () => {
  // 1. Load workspace config
  const { catalog } = yaml.parse(fs.readFileSync(WORKSPACE_YML, "utf8"));

  // 2. Resolve package directory
  const pkgDir = path.join(PACKAGES_DIR, targetPackage);
  if (!fs.existsSync(pkgDir)) {
    console.error(
      `❌ Package "${targetPackage}" not found in ${PACKAGES_DIR}/`
    );
    process.exit(1);
  }

  // 3. Process package
  console.log(`\n🚀 Preparing ${targetPackage}...`);
  const pkgPath = path.join(pkgDir, "package.json");
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));

  // 4. Create temp package.json with resolved versions
  const tempPkg = { ...pkg };
  const replaceDeps = (deps) => {
    if (!deps) return;
    Object.entries(deps).forEach(([dep, version]) => {
      if (version.startsWith("catalog:")) {
        deps[dep] = `^${catalog[dep] || version}`;
      }
    });
  };
  replaceDeps(tempPkg.dependencies);
  replaceDeps(tempPkg.devDependencies);

  // 5. Set up temp dir
  const tempDir = path.join(pkgDir, ".temp-publish");
  fs.mkdirSync(tempDir, { recursive: true });
  fs.writeFileSync(
    path.join(tempDir, "package.json"),
    JSON.stringify(tempPkg, null, 2)
  );

  // 6. Copy required files
  ["README.md", "LICENSE", "dist"].forEach((file) => {
    const src = path.join(pkgDir, file);
    if (fs.existsSync(src)) {
      fs.cpSync(src, path.join(tempDir, file), { recursive: true });
    }
  });

  // 7. Publish (or dry-run)
  console.log(`📦 Package contents (${tempDir}):\n`, fs.readdirSync(tempDir));
  if (dryRun) {
    console.log(
      `✅ [Dry Run] ${pkg.name} ready for publish (versions: ${Object.values(
        tempPkg.dependencies || {}
      ).join(", ")})`
    );
  } else {
    try {
      execSync(`cd ${tempDir} && pnpm publish --access public`, {
        stdio: "inherit",
      });
      console.log(`✅ Successfully published ${pkg.name}@${pkg.version}!`);
    } catch (error) {
      console.error(`❌ Publish failed for ${pkg.name}:`, error.message);
    }
  }

  // 8. Cleanup
  fs.rmSync(tempDir, { recursive: true });
})();
