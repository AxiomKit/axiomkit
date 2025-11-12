import path from "path";
import os from "os";
import fs from "fs-extra";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { main } from "../src/index";

async function createTempProjectDir(prefix: string): Promise<string> {
  const tmpBase = await fs.mkdtemp(path.join(os.tmpdir(), `${prefix}-`));
  return tmpBase;
}

describe("create-agent dependency selection", () => {
  let tmpDir: string;

  beforeAll(async () => {
    tmpDir = await createTempProjectDir("axiomkit-create-agent-test");
  });

  afterAll(async () => {
    if (tmpDir) {
      await fs.remove(tmpDir);
    }
  });

  it(
    "includes telegram provider dependencies when telegram is selected",
    async () => {
      const projectDir = path.join(tmpDir, "proj-telegram");

      await main([projectDir], {
        telegram: true,
        model: "groq",
        skipInstall: true,
        verbose: true,
      });

      const pkgJsonPath = path.join(projectDir, "package.json");
      const pkg = await fs.readJSON(pkgJsonPath);

      expect(pkg).toBeTruthy();
      expect(pkg.dependencies).toBeTruthy();
      expect(pkg.dependencies["@axiomkit/telegram"]).toBeDefined();
      expect(pkg.dependencies["telegraf"]).toBeDefined();
    }
  );

  it("does not include telegram deps when not selected", async () => {
    const projectDir = path.join(tmpDir, "proj-cli-only");

    await main([projectDir], {
      cli: true,
      model: "groq",
      skipInstall: true,
      verbose: true,
    });

    const pkgJsonPath = path.join(projectDir, "package.json");
    const pkg = await fs.readJSON(pkgJsonPath);

    expect(pkg.dependencies["@axiomkit/telegram"]).toBeUndefined();
    expect(pkg.dependencies["telegraf"]).toBeUndefined();
  });
});


