#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// --- Configuration ---
const PACKAGES_DIR = "./packages";
const VERSION_CONFIG_FILE = "./scripts/version-config.json";
const WORKSPACE_CONFIG_FILE = "./pnpm-workspace.yaml";

// --- Version Types ---
const VERSION_TYPES = {
  PATCH: "patch",
  MINOR: "minor", 
  MAJOR: "major",
  PREPATCH: "prepatch",
  PREMINOR: "preminor",
  PREMAJOR: "premajor",
  PRERELEASE: "prerelease"
};

// --- Default Configuration ---
const DEFAULT_CONFIG = {
  packages: {
    "@axiomkit/core": { version: "0.1.0", autoUpdate: true },
    "@axiomkit/cli": { version: "0.1.0", autoUpdate: true },
    "@axiomkit/telegram": { version: "0.1.0", autoUpdate: true },
    "@axiomkit/mongodb": { version: "0.1.0", autoUpdate: true },
    "@axiomkit/sei": { version: "0.1.0", autoUpdate: true },
    "@axiomkit/create-agent": { version: "0.1.0", autoUpdate: true },
    "@axiomkit/supabase": { version: "0.1.0", autoUpdate: true }
  },
  globalVersion: "0.0.6",
  autoSyncVersions: true,
  versionStrategy: "independent", // "independent" or "synchronized"
  catalogManagement: {
    enabled: true,
    updateCatalogOnPublish: true,
    catalogDependencies: [
      "@ai-sdk/anthropic", "@ai-sdk/groq", "@ai-sdk/openai", "@ai-sdk/google",
      "@ai-sdk/provider", "@ai-sdk/ui-utils", "ai", "uuid", "zod", 
      "zod-to-json-schema", "dotenv", "@types/bun", "typescript", 
      "tsup", "vitest", "chalk", "@vitest/ui"
    ]
  }
};

// --- Utility Functions ---
function loadVersionConfig() {
  if (fs.existsSync(VERSION_CONFIG_FILE)) {
    return JSON.parse(fs.readFileSync(VERSION_CONFIG_FILE, "utf8"));
  }
  return DEFAULT_CONFIG;
}

function saveVersionConfig(config) {
  fs.writeFileSync(VERSION_CONFIG_FILE, JSON.stringify(config, null, 2));
}

function loadWorkspaceConfig() {
  if (!fs.existsSync(WORKSPACE_CONFIG_FILE)) {
    throw new Error("pnpm-workspace.yaml not found");
  }
  
  const content = fs.readFileSync(WORKSPACE_CONFIG_FILE, "utf8");
  const lines = content.split("\n");
  const config = {
    packages: [],
    catalog: {},
    overrides: {}
  };
  
  let currentSection = null;
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    if (trimmedLine === "packages:" || trimmedLine.startsWith("packages:")) {
      currentSection = "packages";
      continue;
    } else if (trimmedLine === "catalog:" || trimmedLine.startsWith("catalog:")) {
      currentSection = "catalog";
      continue;
    } else if (trimmedLine === "overrides:" || trimmedLine.startsWith("overrides:")) {
      currentSection = "overrides";
      continue;
    }
    
    if (currentSection === "packages" && trimmedLine.startsWith("-")) {
      config.packages.push(trimmedLine.substring(1).trim());
    } else if (currentSection === "catalog" && trimmedLine.includes(":")) {
      // Handle quoted keys and values with comments
      const colonIndex = trimmedLine.indexOf(":");
      if (colonIndex !== -1) {
        let key = trimmedLine.substring(0, colonIndex).trim();
        let value = trimmedLine.substring(colonIndex + 1).trim();
        
        // Remove comments from value
        const commentIndex = value.indexOf("#");
        if (commentIndex !== -1) {
          value = value.substring(0, commentIndex).trim();
        }
        
        // Remove quotes from key if present
        if (key.startsWith("'") && key.endsWith("'")) {
          key = key.substring(1, key.length - 1);
        }
        
        config.catalog[key] = value;
      }
    } else if (currentSection === "overrides" && trimmedLine.includes(":")) {
      const colonIndex = trimmedLine.indexOf(":");
      if (colonIndex !== -1) {
        let key = trimmedLine.substring(0, colonIndex).trim();
        let value = trimmedLine.substring(colonIndex + 1).trim();
        
        // Remove quotes from key if present
        if (key.startsWith("'") && key.endsWith("'")) {
          key = key.substring(1, key.length - 1);
        }
        
        config.overrides[key] = value;
      }
    }
  }
  
  return config;
}

// Note: We don't save workspace config to preserve pnpm-workspace.yaml as source of truth
// function saveWorkspaceConfig(config) {
//   // This function is intentionally removed to prevent modifying pnpm-workspace.yaml
// }

function getPackagePath(packageName) {
  const packageDir = packageName.replace("@axiomkit/", "");
  return path.join(PACKAGES_DIR, packageDir);
}

function readPackageJson(packagePath) {
  const packageJsonPath = path.join(packagePath, "package.json");
  if (!fs.existsSync(packageJsonPath)) {
    throw new Error(`Package.json not found at ${packageJsonPath}`);
  }
  return JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
}

function writePackageJson(packagePath, packageJson) {
  const packageJsonPath = path.join(packagePath, "package.json");
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
}

function updateVersion(version, type) {
  const [major, minor, patch] = version.split(".").map(Number);
  
  switch (type) {
    case VERSION_TYPES.MAJOR:
      return `${major + 1}.0.0`;
    case VERSION_TYPES.MINOR:
      return `${major}.${minor + 1}.0`;
    case VERSION_TYPES.PATCH:
      return `${major}.${minor}.${patch + 1}`;
    case VERSION_TYPES.PREMAJOR:
      return `${major + 1}.0.0-0`;
    case VERSION_TYPES.PREMINOR:
      return `${major}.${minor + 1}.0-0`;
    case VERSION_TYPES.PREPATCH:
      return `${major}.${minor}.${patch + 1}-0`;
    case VERSION_TYPES.PRERELEASE:
      return `${major}.${minor}.${patch}-0`;
    default:
      throw new Error(`Invalid version type: ${type}`);
  }
}

function validateVersion(version) {
  const semverRegex = /^\d+\.\d+\.\d+(-[0-9A-Za-z-]+(\.[0-9A-Za-z-]+)*)?(\+[0-9A-Za-z-]+(\.[0-9A-Za-z-]+)*)?$/;
  return semverRegex.test(version);
}

function updateCatalogDependencies(packageName, newVersion, config) {
  if (!config.catalogManagement?.enabled) {
    return;
  }
  
  try {
    const workspaceConfig = loadWorkspaceConfig();
    const packagePath = getPackagePath(packageName);
    const packageJson = readPackageJson(packagePath);
    
    // Check if this package has catalog dependencies that should be updated
    const allDependencies = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
      ...packageJson.peerDependencies
    };
    
    const catalogDeps = Object.keys(allDependencies).filter(dep => 
      allDependencies[dep] === "catalog:" && 
      config.catalogManagement.catalogDependencies.includes(dep)
    );
    
    if (catalogDeps.length > 0) {
      console.log(`📦 Updating catalog dependencies for ${packageName}: ${catalogDeps.join(", ")}`);
      
      // Update catalog versions if needed
      for (const dep of catalogDeps) {
        if (workspaceConfig.catalog[dep]) {
          // You could implement logic here to update catalog versions
          // For now, we'll just log that catalog dependencies exist
          console.log(`  - ${dep}: ${workspaceConfig.catalog[dep]}`);
        }
      }
    }
  } catch (error) {
    console.warn(`⚠️  Warning: Could not update catalog dependencies for ${packageName}: ${error.message}`);
  }
}

function syncCatalogVersions(config) {
  if (!config.catalogManagement?.enabled) {
    return;
  }
  
  try {
    console.log("🔄 Syncing catalog versions...");
    execSync("pnpm install", { stdio: "inherit" });
    console.log("✅ Catalog versions synced");
  } catch (error) {
    console.warn(`⚠️  Warning: Could not sync catalog versions: ${error.message}`);
  }
}

// --- Main Functions ---
function updatePackageVersion(packageName, versionType, config) {
  const packagePath = getPackagePath(packageName);
  const packageJson = readPackageJson(packagePath);
  const currentVersion = packageJson.version;
  
  if (!validateVersion(currentVersion)) {
    throw new Error(`Invalid version format in ${packageName}: ${currentVersion}`);
  }
  
  const newVersion = updateVersion(currentVersion, versionType);
  packageJson.version = newVersion;
  
  writePackageJson(packagePath, packageJson);
  
  // Update config
  if (config.packages[packageName]) {
    config.packages[packageName].version = newVersion;
  }
  
  // Update catalog dependencies if enabled
  updateCatalogDependencies(packageName, newVersion, config);
  
  // Auto-update catalog versions if enabled
  autoUpdateCatalogOnPublish(packageName, newVersion, config);
  
  console.log(`✅ Updated ${packageName} from ${currentVersion} to ${newVersion}`);
  return newVersion;
}

function updateAllPackages(versionType, config) {
  const updatedPackages = [];
  
  for (const [packageName, packageConfig] of Object.entries(config.packages)) {
    if (packageConfig.autoUpdate) {
      try {
        const newVersion = updatePackageVersion(packageName, versionType, config);
        updatedPackages.push({ name: packageName, version: newVersion });
      } catch (error) {
        console.error(`❌ Failed to update ${packageName}: ${error.message}`);
      }
    }
  }
  
  // Sync catalog versions after updating all packages
  if (updatedPackages.length > 0) {
    syncCatalogVersions(config);
  }
  
  return updatedPackages;
}

function syncVersions(targetVersion, config) {
  const updatedPackages = [];
  
  for (const [packageName, packageConfig] of Object.entries(config.packages)) {
    if (packageConfig.autoUpdate) {
      try {
        const packagePath = getPackagePath(packageName);
        const packageJson = readPackageJson(packagePath);
        const currentVersion = packageJson.version;
        
        if (currentVersion !== targetVersion) {
          packageJson.version = targetVersion;
          writePackageJson(packagePath, packageJson);
          config.packages[packageName].version = targetVersion;
          updatedPackages.push({ name: packageName, version: targetVersion });
          console.log(`✅ Synced ${packageName} to ${targetVersion}`);
        }
      } catch (error) {
        console.error(`❌ Failed to sync ${packageName}: ${error.message}`);
      }
    }
  }
  
  // Sync catalog versions after syncing all packages
  if (updatedPackages.length > 0) {
    syncCatalogVersions(config);
  }
  
  return updatedPackages;
}

function showStatus(config) {
  console.log("\n📦 Package Version Status:");
  console.log("=" .repeat(50));
  
  const actualVersions = getActualPackageVersions();
  const actualGlobalVersion = getActualGlobalVersion();
  
  for (const [packageName, packageConfig] of Object.entries(config.packages)) {
    const status = packageConfig.autoUpdate ? "🟢 Auto" : "🟡 Manual";
    const configVersion = packageConfig.version;
    const actualVersion = actualVersions[packageName];
    
    if (actualVersion && configVersion !== actualVersion) {
      console.log(`${status} ${packageName}: ${configVersion} → ${actualVersion} (out of sync)`);
    } else {
      console.log(`${status} ${packageName}: ${configVersion}`);
    }
  }
  
  // Show packages that exist but aren't in config
  for (const [packageName, actualVersion] of Object.entries(actualVersions)) {
    if (!config.packages[packageName]) {
      console.log(`🔴 ${packageName}: ${actualVersion} (not in config)`);
    }
  }
  
  console.log(`\n🌐 Global Version: ${config.globalVersion} (actual: ${actualGlobalVersion})`);
  console.log(`📋 Strategy: ${config.versionStrategy}`);
  console.log(`🔄 Auto Sync: ${config.autoSyncVersions ? "Enabled" : "Disabled"}`);
  
  // Show catalog status
  if (config.catalogManagement?.enabled) {
    console.log(`📚 Catalog Management: Enabled`);
    try {
      const workspaceConfig = loadWorkspaceConfig();
      console.log(`📦 Catalog Dependencies: ${Object.keys(workspaceConfig.catalog).length} packages`);
    } catch (error) {
      console.log(`⚠️  Catalog Status: Error loading catalog`);
    }
  }
  
  // Show sync status
  if (config.globalVersion !== actualGlobalVersion) {
    console.log(`\n⚠️  Configuration is out of sync. Run 'pnpm version:sync-config' to update.`);
  }
}

function showCatalogStatus() {
  try {
    const workspaceConfig = loadWorkspaceConfig();
    console.log("\n📚 Catalog Dependencies:");
    console.log("=" .repeat(50));
    
    for (const [packageName, version] of Object.entries(workspaceConfig.catalog)) {
      console.log(`${packageName}: ${version}`);
    }
  } catch (error) {
    console.error(`❌ Error loading catalog: ${error.message}`);
  }
}

function updateCatalogVersion(packageName, newVersion) {
  try {
    const workspaceConfig = loadWorkspaceConfig();
    
    if (workspaceConfig.catalog[packageName]) {
      const oldVersion = workspaceConfig.catalog[packageName];
      workspaceConfig.catalog[packageName] = newVersion;
      saveWorkspaceConfig(workspaceConfig);
      console.log(`✅ Updated catalog ${packageName} from ${oldVersion} to ${newVersion}`);
      return true;
    } else {
      console.error(`❌ Package ${packageName} not found in catalog`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Failed to update catalog: ${error.message}`);
    return false;
  }
}

function updateCatalogVersionsForPackage(packageName, newVersion, config) {
  if (!config.catalogManagement?.enabled) {
    return;
  }
  
  try {
    const workspaceConfig = loadWorkspaceConfig();
    const packagePath = getPackagePath(packageName);
    const packageJson = readPackageJson(packagePath);
    
    // Get all dependencies that use catalog
    const allDependencies = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
      ...packageJson.peerDependencies
    };
    
    const catalogDeps = Object.keys(allDependencies).filter(dep => 
      allDependencies[dep] === "catalog:" && 
      config.catalogManagement.catalogDependencies.includes(dep)
    );
    
    if (catalogDeps.length > 0) {
      console.log(`📦 Checking catalog dependencies for ${packageName}...`);
      
      let catalogUpdates = [];
      
      for (const dep of catalogDeps) {
        if (workspaceConfig.catalog[dep]) {
          const currentCatalogVersion = workspaceConfig.catalog[dep];
          
          // Check if we should update this catalog dependency
          if (shouldUpdateCatalogVersion(dep, currentCatalogVersion, newVersion)) {
            const newCatalogVersion = determineNewCatalogVersion(dep, currentCatalogVersion);
            catalogUpdates.push({
              dependency: dep,
              oldVersion: currentCatalogVersion,
              newVersion: newCatalogVersion
            });
            console.log(`  🔄 Would update catalog ${dep}: ${currentCatalogVersion} → ${newCatalogVersion}`);
          }
        }
      }
      
      if (catalogUpdates.length > 0) {
        console.log("\n💡 To update catalog versions, manually update pnpm-workspace.yaml:");
        console.log("catalog:");
        for (const update of catalogUpdates) {
          console.log(`  ${update.dependency}: ${update.newVersion}`);
        }
        console.log("\n⚠️  Note: Catalog updates must be done manually to maintain workspace integrity");
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.warn(`⚠️  Warning: Could not check catalog versions for ${packageName}: ${error.message}`);
    return false;
  }
}

function shouldUpdateCatalogVersion(dependencyName, currentCatalogVersion, packageVersion) {
  // Customize this logic based on your needs
  // For now, we'll update catalog versions for major version bumps
  const packageMajor = parseInt(packageVersion.split('.')[0]);
  const catalogMajor = parseInt(currentCatalogVersion.split('.')[0]);
  
  // Update catalog if package major version is higher than catalog major version
  return packageMajor > catalogMajor;
}

function determineNewCatalogVersion(dependencyName, currentCatalogVersion) {
  // Customize this logic based on your needs
  // For now, we'll increment the patch version
  const [major, minor, patch] = currentCatalogVersion.split('.').map(Number);
  return `${major}.${minor}.${patch + 1}`;
}

function autoUpdateCatalogOnPublish(packageName, newVersion, config) {
  if (!config.catalogManagement?.updateCatalogOnPublish) {
    return false;
  }
  
  console.log(`🔄 Auto-updating catalog versions for ${packageName}...`);
  return updateCatalogVersionsForPackage(packageName, newVersion, config);
}

function autoDetectNewPackages(config) {
  try {
    const workspaceConfig = loadWorkspaceConfig();
    const detectedPackages = [];
    
    // Scan packages directory for new packages
    const packageDirs = fs.readdirSync(PACKAGES_DIR, { withFileTypes: true });
    
    for (const dir of packageDirs) {
      if (dir.isDirectory() && !dir.name.startsWith(".")) {
        const packageJsonPath = path.join(PACKAGES_DIR, dir.name, "package.json");
        
        if (fs.existsSync(packageJsonPath)) {
          const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
          const packageName = packageJson.name;
          
          // Check if this package is already in our config
          if (packageName && !config.packages[packageName]) {
            detectedPackages.push({
              name: packageName,
              version: packageJson.version,
              path: dir.name
            });
          }
        }
      }
    }
    
    return detectedPackages;
  } catch (error) {
    console.warn(`⚠️  Warning: Could not detect new packages: ${error.message}`);
    return [];
  }
}

function addNewPackagesToConfig(config) {
  const newPackages = autoDetectNewPackages(config);
  
  if (newPackages.length > 0) {
    console.log(`📦 Found ${newPackages.length} new packages to add to version management:`);
    
    for (const pkg of newPackages) {
      config.packages[pkg.name] = {
        version: pkg.version,
        autoUpdate: true
      };
      console.log(`  ✅ Added ${pkg.name} (${pkg.version})`);
    }
    
    saveVersionConfig(config);
    console.log("✅ New packages added to version configuration");
    return newPackages;
  } else {
    console.log("ℹ️  No new packages detected");
    return [];
  }
}

function syncCatalogWithWorkspace(config) {
  try {
    const workspaceConfig = loadWorkspaceConfig();
    const missingCatalogDeps = new Set(); // Use Set to avoid duplicates
    
    // Scan all packages for catalog dependencies
    const packageDirs = fs.readdirSync(PACKAGES_DIR, { withFileTypes: true });
    
    for (const dir of packageDirs) {
      if (dir.isDirectory() && !dir.name.startsWith(".")) {
        const packageJsonPath = path.join(PACKAGES_DIR, dir.name, "package.json");
        
        if (fs.existsSync(packageJsonPath)) {
          const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
          
          // Check all dependency types
          const allDependencies = {
            ...packageJson.dependencies,
            ...packageJson.devDependencies,
            ...packageJson.peerDependencies
          };
          
          // Find catalog dependencies that are missing from workspace
          for (const [depName, depVersion] of Object.entries(allDependencies)) {
            if (depVersion === "catalog:" && !workspaceConfig.catalog[depName]) {
              missingCatalogDeps.add(depName);
            }
          }
        }
      }
    }
    
    const uniqueMissingDeps = Array.from(missingCatalogDeps);
    
    if (uniqueMissingDeps.length > 0) {
      console.log(`📚 Found ${uniqueMissingDeps.length} catalog dependencies missing from workspace:`);
      
      for (const dep of uniqueMissingDeps) {
        console.log(`  ⚠️  Missing: ${dep} (add to pnpm-workspace.yaml manually)`);
      }
      
      console.log("\n💡 To fix this, manually add the missing dependencies to pnpm-workspace.yaml:");
      console.log("catalog:");
      for (const dep of uniqueMissingDeps) {
        console.log(`  ${dep}: latest`);
      }
      
      return uniqueMissingDeps;
    } else {
      console.log("✅ All catalog dependencies are properly configured in pnpm-workspace.yaml");
      return [];
    }
  } catch (error) {
    console.warn(`⚠️  Warning: Could not check catalog dependencies: ${error.message}`);
    return [];
  }
}

function showHelp() {
  console.log(`
📦 AxiomKit Version Manager

Usage:
  node scripts/version-manager.js <command> [options]

Commands:
  status                    Show current version status
  catalog                   Show catalog dependencies status
  update <package> <type>   Update specific package version
  update-all <type>         Update all packages with same version type
  sync <version>            Sync all packages to specific version
  bump <type>               Bump all packages and update global version
  catalog:update <pkg> <ver> Update catalog dependency version
  catalog:auto <on|off>     Enable/disable auto catalog updates
  detect                    Auto-detect and add new packages
  sync-catalog              Sync catalog dependencies with workspace
  sync-config               Sync version config with actual versions
  init                      Initialize version configuration
  help                      Show this help

Version Types:
  patch, minor, major, prepatch, preminor, premajor, prerelease

Examples:
  node scripts/version-manager.js status
  node scripts/version-manager.js catalog
  node scripts/version-manager.js update @axiomkit/core patch
  node scripts/version-manager.js update-all minor
  node scripts/version-manager.js sync 1.0.0
  node scripts/version-manager.js bump patch
  node scripts/version-manager.js catalog:update zod 3.26.0
  node scripts/version-manager.js catalog:auto on
  node scripts/version-manager.js detect
  node scripts/version-manager.js sync-catalog
  node scripts/version-manager.js sync-config
`);
}

function syncConfigWithActualVersions() {
  try {
    const config = loadVersionConfig();
    const workspaceConfig = loadWorkspaceConfig();
    let updated = false;
    
    console.log("🔄 Syncing version configuration with actual versions...");
    
    // Sync package versions from package.json files
    const packageDirs = fs.readdirSync(PACKAGES_DIR, { withFileTypes: true });
    
    for (const dir of packageDirs) {
      if (dir.isDirectory() && !dir.name.startsWith(".")) {
        const packageJsonPath = path.join(PACKAGES_DIR, dir.name, "package.json");
        
        if (fs.existsSync(packageJsonPath)) {
          const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
          const packageName = packageJson.name;
          const actualVersion = packageJson.version;
          
          if (packageName && config.packages[packageName]) {
            const configVersion = config.packages[packageName].version;
            
            if (configVersion !== actualVersion) {
              console.log(`  📦 Updated ${packageName}: ${configVersion} → ${actualVersion}`);
              config.packages[packageName].version = actualVersion;
              updated = true;
            }
          } else if (packageName && !config.packages[packageName]) {
            // Add new package to config
            config.packages[packageName] = {
              version: actualVersion,
              autoUpdate: true
            };
            console.log(`  ✅ Added new package ${packageName}: ${actualVersion}`);
            updated = true;
          }
        }
      }
    }
    
    // Sync catalog dependencies from pnpm-workspace.yaml
    const catalogDeps = Object.keys(workspaceConfig.catalog);
    const configCatalogDeps = config.catalogManagement.catalogDependencies;
    
    // Add missing catalog dependencies
    for (const dep of catalogDeps) {
      if (!configCatalogDeps.includes(dep)) {
        config.catalogManagement.catalogDependencies.push(dep);
        console.log(`  📚 Added catalog dependency: ${dep}`);
        updated = true;
      }
    }
    
    // Remove catalog dependencies that no longer exist in workspace
    const missingDeps = configCatalogDeps.filter(dep => !catalogDeps.includes(dep));
    for (const dep of missingDeps) {
      const index = config.catalogManagement.catalogDependencies.indexOf(dep);
      if (index > -1) {
        config.catalogManagement.catalogDependencies.splice(index, 1);
        console.log(`  🗑️  Removed catalog dependency: ${dep}`);
        updated = true;
      }
    }
    
    // Sync global version from root package.json
    const rootPackageJson = JSON.parse(fs.readFileSync("./package.json", "utf8"));
    const actualGlobalVersion = rootPackageJson.version;
    
    if (config.globalVersion !== actualGlobalVersion) {
      console.log(`  🌐 Updated global version: ${config.globalVersion} → ${actualGlobalVersion}`);
      config.globalVersion = actualGlobalVersion;
      updated = true;
    }
    
    if (updated) {
      saveVersionConfig(config);
      console.log("✅ Version configuration synced successfully");
    } else {
      console.log("ℹ️  Version configuration is already up to date");
    }
    
    return config;
  } catch (error) {
    console.error(`❌ Error syncing version configuration: ${error.message}`);
    return null;
  }
}

function getActualPackageVersions() {
  const versions = {};
  const packageDirs = fs.readdirSync(PACKAGES_DIR, { withFileTypes: true });
  
  for (const dir of packageDirs) {
    if (dir.isDirectory() && !dir.name.startsWith(".")) {
      const packageJsonPath = path.join(PACKAGES_DIR, dir.name, "package.json");
      
      if (fs.existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
        if (packageJson.name) {
          versions[packageJson.name] = packageJson.version;
        }
      }
    }
  }
  
  return versions;
}

function getActualCatalogVersions() {
  try {
    const workspaceConfig = loadWorkspaceConfig();
    return workspaceConfig.catalog;
  } catch (error) {
    console.warn(`⚠️  Warning: Could not load catalog versions: ${error.message}`);
    return {};
  }
}

function getActualGlobalVersion() {
  try {
    const rootPackageJson = JSON.parse(fs.readFileSync("./package.json", "utf8"));
    return rootPackageJson.version;
  } catch (error) {
    console.warn(`⚠️  Warning: Could not load global version: ${error.message}`);
    return "0.0.0";
  }
}

// --- Main Execution ---
function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (!command || command === "help") {
    showHelp();
    return;
  }
  
  let config = loadVersionConfig();
  
  try {
    switch (command) {
      case "status":
        showStatus(config);
        break;
        
      case "catalog":
        showCatalogStatus();
        break;
        
      case "update":
        if (args.length < 3) {
          console.error("❌ Usage: update <package> <type>");
          process.exit(1);
        }
        const packageName = args[1];
        const versionType = args[2];
        
        if (!config.packages[packageName]) {
          console.error(`❌ Package ${packageName} not found in configuration`);
          process.exit(1);
        }
        
        if (!VERSION_TYPES[versionType.toUpperCase()]) {
          console.error(`❌ Invalid version type: ${versionType}`);
          process.exit(1);
        }
        
        updatePackageVersion(packageName, versionType, config);
        saveVersionConfig(config);
        break;
        
      case "update-all":
        if (args.length < 2) {
          console.error("❌ Usage: update-all <type>");
          process.exit(1);
        }
        const allVersionType = args[1];
        
        if (!VERSION_TYPES[allVersionType.toUpperCase()]) {
          console.error(`❌ Invalid version type: ${allVersionType}`);
          process.exit(1);
        }
        
        const updatedPackages = updateAllPackages(allVersionType, config);
        saveVersionConfig(config);
        
        console.log(`\n✅ Updated ${updatedPackages.length} packages`);
        break;
        
      case "sync":
        if (args.length < 2) {
          console.error("❌ Usage: sync <version>");
          process.exit(1);
        }
        const targetVersion = args[1];
        
        if (!validateVersion(targetVersion)) {
          console.error(`❌ Invalid version format: ${targetVersion}`);
          process.exit(1);
        }
        
        const syncedPackages = syncVersions(targetVersion, config);
        config.globalVersion = targetVersion;
        saveVersionConfig(config);
        
        console.log(`\n✅ Synced ${syncedPackages.length} packages to ${targetVersion}`);
        break;
        
      case "bump":
        if (args.length < 2) {
          console.error("❌ Usage: bump <type>");
          process.exit(1);
        }
        const bumpType = args[1];
        
        if (!VERSION_TYPES[bumpType.toUpperCase()]) {
          console.error(`❌ Invalid version type: ${bumpType}`);
          process.exit(1);
        }
        
        const bumpedPackages = updateAllPackages(bumpType, config);
        config.globalVersion = updateVersion(config.globalVersion, bumpType);
        saveVersionConfig(config);
        
        console.log(`\n✅ Bumped ${bumpedPackages.length} packages and global version to ${config.globalVersion}`);
        break;
        
      case "catalog:update":
        if (args.length < 3) {
          console.error("❌ Usage: catalog:update <package> <version>");
          process.exit(1);
        }
        const catalogPackage = args[1];
        const catalogVersion = args[2];
        
        if (!validateVersion(catalogVersion)) {
          console.error(`❌ Invalid version format: ${catalogVersion}`);
          process.exit(1);
        }
        
        updateCatalogVersion(catalogPackage, catalogVersion);
        break;
        
      case "catalog:auto":
        if (args.length < 2) {
          console.error("❌ Usage: catalog:auto <on|off>");
          process.exit(1);
        }
        const autoSetting = args[1].toLowerCase();
        
        if (autoSetting !== "on" && autoSetting !== "off") {
          console.error("❌ Invalid setting. Use 'on' or 'off'");
          process.exit(1);
        }
        
        config.catalogManagement.updateCatalogOnPublish = autoSetting === "on";
        saveVersionConfig(config);
        console.log(`✅ Auto catalog updates ${autoSetting === "on" ? "enabled" : "disabled"}`);
        break;
        
      case "detect":
        addNewPackagesToConfig(config);
        break;
        
      case "sync-catalog":
        syncCatalogWithWorkspace(config);
        break;
        
      case "sync-config":
        syncConfigWithActualVersions();
        break;
        
      case "init":
        if (!fs.existsSync(VERSION_CONFIG_FILE)) {
          saveVersionConfig(DEFAULT_CONFIG);
          console.log("✅ Initialized version configuration");
        } else {
          console.log("ℹ️  Version configuration already exists");
        }
        break;
        
      default:
        console.error(`❌ Unknown command: ${command}`);
        showHelp();
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

module.exports = {
  loadVersionConfig,
  saveVersionConfig,
  updatePackageVersion,
  updateAllPackages,
  syncVersions,
  loadWorkspaceConfig,
  updateCatalogVersion,
  autoUpdateCatalogOnPublish,
  autoDetectNewPackages,
  addNewPackagesToConfig,
  syncCatalogWithWorkspace,
  VERSION_TYPES,
  syncConfigWithActualVersions,
  getActualPackageVersions,
  getActualCatalogVersions,
  getActualGlobalVersion
}; 