// scripts/replace-catalog-deps.js
const fs = require("fs");
const path = require("path");
const yaml = require("yaml");

const pkgDir = process.cwd();
const rootDir = path.join(pkgDir, "../.."); // Monorepo root
const pkgPath = path.join(pkgDir, "package.json");
const workspaceYmlPath = path.join(rootDir, "pnpm-workspace.yaml");

// 2. Read pnpm-workspace.yml
const workspaceYml = fs.readFileSync(workspaceYmlPath, "utf8");
const { catalog } = yaml.parse(workspaceYml);

// 3. Read package.json
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));

// 4. Replace "catalog:" with versions
const replaceDeps = (deps) => {
  if (!deps) return;
  for (const [dep, version] of Object.entries(deps)) {
    if (version.startsWith("catalog:")) {
      const realVersion = catalog[dep];
      if (realVersion) {
        deps[dep] = `^${realVersion}`;
      }
    }
  }
};

replaceDeps(pkg.dependencies);
replaceDeps(pkg.devDependencies);

// 5. Save the modified package.json
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2), "utf8");
console.log(`✅ [${pkg.name}] Replaced 'catalog:' dependencies`);
