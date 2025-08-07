# AxiomKit Version Management System

This directory contains scripts for managing versions and publishing npm packages in the AxiomKit monorepo.

## 📦 Scripts Overview

### Version Management (`version-manager.js`)
Centralized version management for all packages in the monorepo.

### Enhanced Publishing (`enhanced-publish.js`)
Advanced publishing with version management, testing, and git tagging.

### Batch Publishing (`batch-publish.js`)
Publish multiple packages with various strategies.

## 🚀 Quick Start

### 1. Initialize Version Configuration
```bash
pnpm version:init
```

### 2. Check Current Status
```bash
pnpm version:status
```

### 3. Update Versions
```bash
# Update specific package
pnpm version:update @axiomkit/core patch

# Update all packages
pnpm version:update-all minor

# Sync all packages to specific version
pnpm version:sync 1.0.0

# Bump all packages and global version
pnpm version:bump patch

# Check catalog dependencies
pnpm version:catalog

# Update catalog dependency version
pnpm version:catalog:update zod 3.26.0

# Enable/disable auto catalog updates
pnpm version:catalog:auto on
pnpm version:catalog:auto off

# Auto-detect new packages
pnpm version:detect

# Sync catalog dependencies
pnpm version:sync-catalog

# Sync version config with actual versions
pnpm version:sync-config
```

### 4. Publish Packages
```bash
# Enhanced publishing with version management
pnpm publish:enhanced @axiomkit/core --bump patch

# Batch publishing
pnpm publish:batch all --bump minor --dry-run
pnpm publish:batch packages @axiomkit/core,@axiomkit/cli
pnpm publish:batch changed --bump patch
```

## 📋 Version Management Commands

### `version:status`
Show current version status of all packages.

```bash
pnpm version:status
```

Output:
```
📦 Package Version Status:
==================================================
🟢 Auto @axiomkit/core: 0.1.0
🟢 Auto @axiomkit/cli: 0.1.0
🟡 Manual @axiomkit/telegram: 0.1.0

🌐 Global Version: 0.0.6
📋 Strategy: independent
🔄 Auto Sync: Enabled
```

### `version:update <package> <type>`
Update version of a specific package.

```bash
pnpm version:update @axiomkit/core patch
pnpm version:update @axiomkit/core minor
pnpm version:update @axiomkit/core major
```

Version types:
- `patch` - Bug fixes (0.1.0 → 0.1.1)
- `minor` - New features (0.1.0 → 0.2.0)
- `major` - Breaking changes (0.1.0 → 1.0.0)
- `prepatch` - Pre-release patch (0.1.0 → 0.1.1-0)
- `preminor` - Pre-release minor (0.1.0 → 0.2.0-0)
- `premajor` - Pre-release major (0.1.0 → 1.0.0-0)
- `prerelease` - Pre-release (0.1.0 → 0.1.0-0)

### `version:update-all <type>`
Update all packages with the same version type.

```bash
pnpm version:update-all patch
pnpm version:update-all minor
```

### `version:sync <version>`
Sync all packages to a specific version.

```bash
pnpm version:sync 1.0.0
```

### `version:bump <type>`
Bump all packages and update the global version.

```bash
pnpm version:bump patch
```

### `version:catalog`
Show catalog dependencies status.

```bash
pnpm version:catalog
```

### `version:catalog:update <package> <version>`
Update a catalog dependency version.

```bash
pnpm version:catalog:update zod 3.26.0
pnpm version:catalog:update typescript 5.9.0
```

### `version:catalog:auto <on|off>`
Enable or disable automatic catalog version updates when publishing.

```bash
pnpm version:catalog:auto on   # Enable auto updates
pnpm version:catalog:auto off  # Disable auto updates
```

### `version:detect`
Auto-detect and add new packages to version management.

```bash
pnpm version:detect
```

### `version:sync-catalog`
Check for missing catalog dependencies in workspace packages.

```bash
pnpm version:sync-catalog
```

### `version:sync-config`
Sync version configuration with actual versions from package.json files and pnpm-workspace.yaml.

```bash
pnpm version:sync-config
```

## 🚀 Publishing Commands

### Enhanced Publishing (`publish:enhanced`)

```bash
# Basic publishing
pnpm publish:enhanced @axiomkit/core

# With version bump
pnpm publish:enhanced @axiomkit/core --bump patch

# With specific version
pnpm publish:enhanced @axiomkit/core --version 1.0.0

# Dry run
pnpm publish:enhanced @axiomkit/core --bump minor --dry-run

# Skip tests or build
pnpm publish:enhanced @axiomkit/core --skip-tests --skip-build
```

Options:
- `--dry-run` - Simulate publishing without actually publishing
- `--bump <type>` - Bump version before publishing
- `--version <version>` - Set specific version
- `--skip-build` - Skip build step
- `--skip-tests` - Skip test step

### Batch Publishing (`publish:batch`)

```bash
# Publish all packages
pnpm publish:batch all --bump minor

# Publish specific packages
pnpm publish:batch packages @axiomkit/core,@axiomkit/cli

# Publish only changed packages
pnpm publish:batch changed --bump patch

# Dry run
pnpm publish:batch all --dry-run

# Skip tests and build
pnpm publish:batch all --skip-tests --skip-build
```

Commands:
- `all` - Publish all packages
- `packages <pkg1,pkg2,...>` - Publish specific packages
- `changed` - Publish only changed packages

Options:
- `--bump <type>` - Bump version before publishing
- `--dry-run` - Simulate publishing
- `--skip-tests` - Skip test step
- `--skip-build` - Skip build step
- `--parallel` - Publish packages in parallel (not yet implemented)

## 🔄 Auto Catalog Updates

The system can automatically update catalog versions when you publish packages. This feature is controlled by the `updateCatalogOnPublish` setting in the configuration.

## 📦 Auto Package Detection

The system can automatically detect new packages added to the `packages/` directory and add them to version management.

### How It Works

1. **Scan packages directory**: Detects new packages in `packages/`
2. **Check package.json**: Reads version and name from each package
3. **Add to config**: Automatically adds new packages to version management
4. **Check catalog dependencies**: Reports missing catalog dependencies (manual update required)

### Usage

```bash
# Auto-detect new packages
pnpm version:detect

# Check catalog dependencies
pnpm version:sync-catalog
```

## 🔄 Version Configuration Sync

The system can automatically sync the version configuration with actual versions from package.json files and pnpm-workspace.yaml.

### How It Works

1. **Read actual versions**: Scans all package.json files for current versions
2. **Compare with config**: Compares actual versions with configuration
3. **Update config**: Updates configuration to match actual versions
4. **Sync catalog**: Updates catalog dependencies list from pnpm-workspace.yaml
5. **Sync global version**: Updates global version from root package.json

### Usage

```bash
# Sync version configuration with actual versions
pnpm version:sync-config

# Check sync status
pnpm version:status
```

### How It Works

1. **When enabled**: When you publish a package with a version bump, the system checks if any catalog dependencies should be updated
2. **Update logic**: Currently updates catalog versions when package major version is higher than catalog major version
3. **Customizable**: You can modify the update logic in `shouldUpdateCatalogVersion()` and `determineNewCatalogVersion()` functions

### Enable/Disable

```bash
# Enable auto catalog updates
pnpm version:catalog:auto on

# Disable auto catalog updates
pnpm version:catalog:auto off
```

### Example

```bash
# With auto catalog updates enabled
pnpm publish:enhanced @axiomkit/core --bump major
# This will:
# 1. Update @axiomkit/core from 0.1.0 to 1.0.0
# 2. Check catalog dependencies
# 3. Auto-update catalog versions if needed
# 4. Publish the package
```

## ⚙️ Configuration

The version management system uses a configuration file at `scripts/version-config.json`:

```json
{
  "packages": {
    "@axiomkit/core": { "version": "0.1.0", "autoUpdate": true },
    "@axiomkit/cli": { "version": "0.1.0", "autoUpdate": true },
    "@axiomkit/telegram": { "version": "0.1.0", "autoUpdate": true }
  },
  "globalVersion": "0.0.6",
  "autoSyncVersions": true,
  "versionStrategy": "independent",
  "catalogManagement": {
    "enabled": true,
    "updateCatalogOnPublish": true,
    "catalogDependencies": [
      "@ai-sdk/anthropic", "@ai-sdk/groq", "@ai-sdk/openai", "@ai-sdk/google",
      "@ai-sdk/provider", "@ai-sdk/ui-utils", "ai", "uuid", "zod", 
      "zod-to-json-schema", "dotenv", "@types/bun", "typescript", 
      "tsup", "vitest", "chalk", "@vitest/ui"
    ]
  }
}
```

### Configuration Options

- `packages` - Package-specific settings
  - `version` - Current version
  - `autoUpdate` - Whether to include in bulk operations
- `globalVersion` - Root package version
- `autoSyncVersions` - Whether to sync versions automatically
- `versionStrategy` - "independent" or "synchronized"
- `catalogManagement` - Catalog dependency management
  - `enabled` - Whether catalog management is enabled
  - `updateCatalogOnPublish` - Whether to update catalog on publish
  - `catalogDependencies` - List of catalog-managed dependencies

## 🔄 Workflow Examples

### 1. Release a New Feature
```bash
# 1. Check current status
pnpm version:status

# 2. Update versions for affected packages
pnpm version:update @axiomkit/core minor
pnpm version:update @axiomkit/cli patch

# 3. Publish with enhanced workflow
pnpm publish:enhanced @axiomkit/core
pnpm publish:enhanced @axiomkit/cli
```

### 2. Release All Packages
```bash
# 1. Bump all packages
pnpm version:bump minor

# 2. Publish all packages
pnpm publish:batch all
```

### 3. Release Only Changed Packages
```bash
# Publish only packages that have changed since last commit
pnpm publish:batch changed --bump patch
```

### 4. Pre-release Workflow
```bash
# 1. Create pre-release versions
pnpm version:update-all prerelease

# 2. Publish pre-releases
pnpm publish:batch all --dry-run

# 3. When ready, create final release
pnpm version:update-all patch
pnpm publish:batch all
```

### 5. Catalog Management Workflow
```bash
# 1. Check current catalog status
pnpm version:catalog

# 2. Enable auto catalog updates (optional)
pnpm version:catalog:auto on

# 3. Update catalog dependencies manually (if needed)
pnpm version:catalog:update zod 3.26.0
pnpm version:catalog:update typescript 5.9.0

# 4. Sync catalog changes
pnpm install

# 5. Publish with updated catalog (auto-updates catalog if enabled)
pnpm publish:enhanced @axiomkit/core --bump patch
```

### 6. Adding New Packages Workflow
```bash
# 1. Add new package to packages/ directory
# 2. Auto-detect new packages
pnpm version:detect

# 3. Check catalog dependencies (if needed)
pnpm version:sync-catalog

# 4. Manually add missing catalog dependencies to pnpm-workspace.yaml
# 5. Sync version configuration
pnpm version:sync-config

# 6. Check status
pnpm version:status

# 7. Publish new package
pnpm publish:enhanced @axiomkit/new-package --bump patch
```

## 🛠️ Development

### Adding New Packages

1. Add the package to the configuration in `version-manager.js`:
```javascript
const DEFAULT_CONFIG = {
  packages: {
    "@axiomkit/new-package": { version: "0.1.0", autoUpdate: true }
  }
  // ...
};
```

2. Initialize the configuration:
```bash
pnpm version:init
```

### Customizing Version Strategy

You can modify the version strategy in the configuration:

- `independent` - Each package has its own version
- `synchronized` - All packages share the same version

### Extending the System

The scripts are modular and can be extended:

- Add new version types in `VERSION_TYPES`
- Add new publishing strategies in `batch-publish.js`
- Add new validation rules in the utility functions

## 🐛 Troubleshooting

### Common Issues

1. **Package not found**
   - Ensure the package exists in `packages/` directory
   - Check the package name in configuration

2. **Version format errors**
   - Ensure versions follow semver format (x.y.z)
   - Check for invalid characters in version strings

3. **Publishing failures**
   - Check npm authentication
   - Ensure package.json has correct publishConfig
   - Verify git status is clean

4. **Test failures**
   - Run tests manually: `pnpm --filter @axiomkit/core test`
   - Check for missing dependencies

### Debug Mode

Add `--debug` to any command for verbose output:

```bash
pnpm version:status --debug
pnpm publish:enhanced @axiomkit/core --debug
```

## 📚 Best Practices

1. **Always check status before publishing**
   ```bash
   pnpm version:status
   ```

2. **Use dry-run for testing**
   ```bash
   pnpm publish:enhanced @axiomkit/core --dry-run
   ```

3. **Commit changes before publishing**
   ```bash
   git add .
   git commit -m "Bump versions for release"
   ```

4. **Use semantic versioning**
   - `patch` for bug fixes
   - `minor` for new features
   - `major` for breaking changes

5. **Test before publishing**
   ```bash
   pnpm test
   pnpm build:packages
   ```

