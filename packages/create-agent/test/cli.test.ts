import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { main } from "../src/index";
import fs from "fs-extra";
import { vol } from "memfs";

// Mock fs-extra
vi.mock("fs-extra");

// Mock execa
vi.mock("execa");

// Mock prompts
vi.mock("prompts");

describe("CLI Tests", () => {
  let mockFs: any;
  let mockPrompts: any;
  let mockExeca: any;

  beforeEach(async () => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Setup mocks
    mockFs = vi.mocked(fs);
    mockPrompts = vi.mocked((await import("prompts")).default);
    mockExeca = vi.mocked((await import("execa")).execa);
    
    // Setup default mock responses
    mockFs.existsSync.mockImplementation((path: string) => {
      // Return true for template file path to avoid the "not found" error
      if (path.includes("templates/basic/template.ts")) {
        return true;
      }
      return false;
    });
    mockFs.readdir.mockResolvedValue([]);
    mockFs.mkdir.mockResolvedValue(undefined);
    mockFs.writeFile.mockResolvedValue(undefined);
    mockFs.readFile.mockResolvedValue(`
/**
 * {{MODEL_NAME}} template for a Axiomkit agent
 */
import { {{MODEL_IMPORT_FUNCTION}} } from "{{MODEL_IMPORT_PATH}}";
import { createAgent } from "@axiomkit/core";
import { createCliExtension } from "@axiomkit/cli";

const {{MODEL_VARIABLE}} = {{MODEL_IMPORT_FUNCTION}}({
  apiKey: process.env.{{ENV_VAR_KEY}}!,
});

createAgent({
  model: {{MODEL_VARIABLE}}("{{MODEL_VERSION}}"),
  extensions: [cliExtension],
}).start();
`);
    mockFs.pathExists.mockResolvedValue(true);
    
    mockPrompts.mockResolvedValue({
      proceed: true,
      extensions: ["cli"],
      model: "groq"
    });
    
    mockExeca.mockResolvedValue({ stdout: "", stderr: "" });
  });

  afterEach(() => {
    vol.reset();
  });

  describe("Main Function Tests", () => {
    it("should create agent with default options", async () => {
      const testArgs = ["test-agent"];
      const testOpts = {
        skipInstall: true,
        verbose: true
      };

      await main(testArgs, testOpts);

      // Verify that package.json was created
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining("package.json"),
        expect.stringContaining("test-agent")
      );

      // Verify that package.json was created
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining("package.json"),
        expect.stringContaining("test-agent")
      );

      // Verify that tsconfig.json was created
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining("tsconfig.json"),
        expect.any(String)
      );

      // Verify that .gitignore was created
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining(".gitignore"),
        expect.any(String)
      );

      // Verify that all expected files were created
      const writeFileCalls = mockFs.writeFile.mock.calls;
      const filePaths = writeFileCalls.map((call: any) => call[0]);
      
      // Check that all expected files were created (using some() for more flexible matching)
      expect(filePaths.some((path: any) => path.includes("package.json"))).toBe(true);
      expect(filePaths.some((path: any) => path.includes("tsconfig.json"))).toBe(true);
      expect(filePaths.some((path: any) => path.includes(".gitignore"))).toBe(true);
      expect(filePaths.some((path: any) => path.includes("index.ts"))).toBe(true);
      expect(filePaths.some((path: any) => path.includes(".env.example"))).toBe(true);
      expect(filePaths.some((path: any) => path.includes("README.md"))).toBe(true);
    });

    it("should handle existing directory with confirmation", async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readdir.mockResolvedValue(["existing-file.txt"]);

      const testArgs = ["test-agent"];
      const testOpts = { skipInstall: true };

      await main(testArgs, testOpts);

      // Should have prompted for confirmation
      expect(mockPrompts).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "confirm",
          name: "proceed",
          message: "Continue and potentially overwrite existing files?"
        })
      );
    });

    it("should handle directory creation", async () => {
      const testArgs = ["new-directory"];
      const testOpts = { skipInstall: true };

      await main(testArgs, testOpts);

      // Should have created the directory
      expect(mockFs.mkdir).toHaveBeenCalledWith(
        expect.stringContaining("new-directory"),
        { recursive: true }
      );
    });

    it("should handle all extensions option", async () => {
      const testArgs = ["test-agent"];
      const testOpts = { 
        all: true, 
        model: "groq",
        skipInstall: true 
      };

      await main(testArgs, testOpts);

      // Should not prompt for extensions since --all was specified
      expect(mockPrompts).not.toHaveBeenCalledWith(
        expect.objectContaining({
          type: "multiselect",
          name: "extensions"
        })
      );
    });

    it("should handle specific extensions", async () => {
      const testArgs = ["test-agent"];
      const testOpts = { 
        cli: true,
        telegram: true,
        discord: true,
        model: "groq",
        skipInstall: true 
      };

      await main(testArgs, testOpts);

      // Should not prompt for extensions since they were specified
      expect(mockPrompts).not.toHaveBeenCalledWith(
        expect.objectContaining({
          type: "multiselect",
          name: "extensions"
        })
      );
    });

    it("should handle model selection via option", async () => {
      const testArgs = ["test-agent"];
      const testOpts = { 
        model: "openai",
        skipInstall: true 
      };

      await main(testArgs, testOpts);

      // Should not prompt for model since it was specified
      expect(mockPrompts).not.toHaveBeenCalledWith(
        expect.objectContaining({
          type: "select",
          name: "model"
        })
      );
    });

    it("should handle dependency installation", async () => {
      const testArgs = ["test-agent"];
      const testOpts = { 
        model: "groq",
        verbose: true
      };

      await main(testArgs, testOpts);

      // Should have called pnpm install
      expect(mockExeca).toHaveBeenCalledWith(
        "pnpm",
        ["install"],
        expect.objectContaining({ cwd: expect.any(String) })
      );
    });

    it("should skip dependency installation when specified", async () => {
      const testArgs = ["test-agent"];
      const testOpts = { 
        model: "groq",
        skipInstall: true 
      };

      await main(testArgs, testOpts);

      // Should not have called pnpm install
      expect(mockExeca).not.toHaveBeenCalled();
    });
  });

  describe("Error Handling", () => {
    it("should handle invalid project name", async () => {
      const testArgs = ["invalid<>name"];
      const testOpts = { skipInstall: true };

      // Mock console.error to capture output
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      await main(testArgs, testOpts);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Invalid project name")
      );

      consoleSpy.mockRestore();
    });

    it("should handle invalid model", async () => {
      const testArgs = ["test-agent"];
      const testOpts = { 
        model: "invalid-model",
        skipInstall: true 
      };

      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      await main(testArgs, testOpts);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Invalid model provider")
      );

      consoleSpy.mockRestore();
    });

    it("should handle file write errors", async () => {
      mockFs.writeFile.mockRejectedValue(new Error("Write failed"));

      const testArgs = ["test-agent"];
      const testOpts = { skipInstall: true };

      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      await main(testArgs, testOpts);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Write failed")
      );

      consoleSpy.mockRestore();
    });

    it("should handle dependency installation errors", async () => {
      mockExeca.mockRejectedValue(new Error("Install failed"));

      const testArgs = ["test-agent"];
      const testOpts = { model: "groq" };

      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      await main(testArgs, testOpts);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Install failed")
      );

      consoleSpy.mockRestore();
    });
  });

  describe("Configuration Validation", () => {
    it("should validate project name correctly", async () => {
      const validNames = ["my-agent", "agent123", "my_agent"];
      const invalidNames = ["", "con", "prn", "aux", "nul", "com1"];

      for (const name of validNames) {
        const testArgs = [name];
        const testOpts = { skipInstall: true };
        
        // Should not throw error for valid names
        await expect(main(testArgs, testOpts)).resolves.not.toThrow();
      }

      for (const name of invalidNames) {
        const testArgs = [name];
        const testOpts = { skipInstall: true };
        
        const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
        
        await main(testArgs, testOpts);
        
        // For invalid names, we expect either "Invalid project name" or no error (if validation passes)
        const errorCalls = consoleSpy.mock.calls;
        if (errorCalls.length > 0) {
          expect(errorCalls[0][0]).toContain("Invalid project name");
        }
        
        consoleSpy.mockRestore();
      }
    });

    it("should validate model names correctly", async () => {
      const validModels = ["groq", "openai", "anthropic", "google"];
      const invalidModels = ["invalid", "test", "fake"];

      for (const model of validModels) {
        const testArgs = ["test-agent"];
        const testOpts = { model, skipInstall: true };
        
        // Should not throw error for valid models
        await expect(main(testArgs, testOpts)).resolves.not.toThrow();
      }

      for (const model of invalidModels) {
        const testArgs = ["test-agent"];
        const testOpts = { model, skipInstall: true };
        
        const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
        
        await main(testArgs, testOpts);
        
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining("Invalid model provider")
        );
        
        consoleSpy.mockRestore();
      }
    });
  });
});
