import { describe, it, expect, beforeEach } from "vitest";
import { generateTemplateContent } from "../src/utils";
import { MODEL_CONFIG } from "../src/config";
import fs from "fs-extra";
import path from "path";

describe("Template Generation Tests", () => {
  let templateContent: string;

  beforeEach(async () => {
    // Load the actual template file
    const templatePath = path.join(__dirname, "../templates/basic/template.ts");
    templateContent = await fs.readFile(templatePath, "utf-8");
  });

  describe("Template Content Validation", () => {
    it("should load template file successfully", () => {
      expect(templateContent).toBeDefined();
      expect(templateContent.length).toBeGreaterThan(0);
    });

    it("should contain expected placeholders", () => {
      const expectedPlaceholders = [
        "{{MODEL_NAME}}",
        "{{MODEL_IMPORT_FUNCTION}}",
        "{{MODEL_IMPORT_PATH}}",
        "{{ENV_VAR_KEY}}",
        "{{MODEL_VARIABLE}}",
        "{{MODEL_VERSION}}",
        "{{goal}}",
      ];

      expectedPlaceholders.forEach((placeholder) => {
        expect(templateContent).toContain(placeholder);
      });
    });

    it("should contain expected extension references", () => {
      // Check for CLI extension reference
      expect(templateContent).toContain(
        'import { createCliExtension } from "@axiomkit/cli"'
      );
      expect(templateContent).toContain("cliExtension");
    });
  });

  describe("Template Generation with Different Models", () => {
    it("should generate correct content for Groq model", () => {
      const config = MODEL_CONFIG.groq;
      const result = generateTemplateContent(templateContent, config);

      // Check that all placeholders are replaced
      expect(result).not.toContain("{{MODEL_NAME}}");
      expect(result).not.toContain("{{MODEL_IMPORT_FUNCTION}}");
      expect(result).not.toContain("{{MODEL_IMPORT_PATH}}");
      expect(result).not.toContain("{{ENV_VAR_KEY}}");
      expect(result).not.toContain("{{MODEL_VARIABLE}}");
      expect(result).not.toContain("{{MODEL_VERSION}}");

      // Check that correct values are inserted
      expect(result).toContain("Groq");
      expect(result).toContain("createGroq");
      expect(result).toContain("@ai-sdk/groq");
      expect(result).toContain("GROQ_API_KEY");
      expect(result).toContain("groq");
    });

    it("should generate correct content for OpenAI model", () => {
      const config = MODEL_CONFIG.openai;
      const result = generateTemplateContent(templateContent, config);

      expect(result).toContain("OpenAI");
      expect(result).toContain("createOpenAI");
      expect(result).toContain("@ai-sdk/openai");
      expect(result).toContain("OPENAI_API_KEY");
      expect(result).toContain("openai");
      expect(result).toContain("gpt-4o");
    });

    it("should generate correct content for Anthropic model", () => {
      const config = MODEL_CONFIG.anthropic;
      const result = generateTemplateContent(templateContent, config);

      expect(result).toContain("Anthropic");
      expect(result).toContain("createAnthropic");
      expect(result).toContain("@ai-sdk/anthropic");
      expect(result).toContain("ANTHROPIC_API_KEY");
      expect(result).toContain("anthropic");
      expect(result).toContain("claude-3-opus-20240229");
    });

    it("should generate correct content for Google model", () => {
      const config = MODEL_CONFIG.google;
      const result = generateTemplateContent(templateContent, config);

      expect(result).toContain("Google");
      expect(result).toContain("createGoogle");
      expect(result).toContain("@ai-sdk/google");
      expect(result).toContain("GOOGLE_API_KEY");
      expect(result).toContain("google");
      expect(result).toContain("gemini-1.5-pro");
    });
  });

  describe("Extension Handling", () => {
    it("should handle CLI extension correctly", () => {
      const config = MODEL_CONFIG.groq;
      const extensionImports = [
        'import { createCliExtension } from "@axiomkit/cli";',
      ];
      const extensionsList = ["cliExtension"];

      const result = generateTemplateContent(
        templateContent,
        config,
        extensionImports,
        extensionsList
      );

      // Check that extension imports are properly handled
      expect(result).toContain(
        'import { createCliExtension } from "@axiomkit/cli";'
      );

      // Check that extensions list is properly replaced
      expect(result).toContain("extensions: [cliExtension]");
    });

    it("should handle multiple extensions correctly", () => {
      const config = MODEL_CONFIG.groq;
      const extensionImports = [
        'import { createCliExtension } from "@axiomkit/cli";',
        'import { telegram } from "@axiomkit/telegram";',
        'import { discord } from "@axiomkit/discord";',
      ];
      const extensionsList = ["cliExtension", "telegram", "discord"];

      const result = generateTemplateContent(
        templateContent,
        config,
        extensionImports,
        extensionsList
      );

      // Check that all extension imports are present
      expect(result).toContain(
        'import { createCliExtension } from "@axiomkit/cli";'
      );
      expect(result).toContain(
        'import { telegram } from "@axiomkit/telegram";'
      );
      expect(result).toContain('import { discord } from "@axiomkit/discord";');

      // Check that extensions list is properly replaced
      expect(result).toContain("extensions: [cliExtension, telegram, discord]");
    });

    it("should handle no extensions correctly", () => {
      const config = MODEL_CONFIG.groq;
      const result = generateTemplateContent(templateContent, config, [], []);

      // Should still contain the original CLI extension reference
      expect(result).toContain(
        'import { createCliExtension } from "@axiomkit/cli";'
      );
      expect(result).toContain("extensions: [cliExtension]");
    });
  });

  describe("Template Structure Validation", () => {
    it("should generate valid TypeScript code", () => {
      const config = MODEL_CONFIG.groq;
      const result = generateTemplateContent(templateContent, config);

      // Check for basic TypeScript structure
      expect(result).toContain("import");
      expect(result).toContain("export");
      expect(result).toContain("const");
      expect(result).toContain("interface");
      expect(result).toContain("async"); // Check for async functions instead of function keyword
    });

    it("should maintain proper syntax after replacement", () => {
      const config = MODEL_CONFIG.groq;
      const result = generateTemplateContent(templateContent, config);

      // Check that semicolons and brackets are preserved
      expect(result).toContain(";");
      expect(result).toContain("{");
      expect(result).toContain("}");
      expect(result).toContain("(");
      expect(result).toContain(")");
    });

    it("should not have double replacements", () => {
      const config = MODEL_CONFIG.groq;
      const result = generateTemplateContent(templateContent, config);

      // Check that no placeholder remains
      const remainingPlaceholders = result.match(/\{\{[^}]+\}\}/g);
      expect(remainingPlaceholders).toBeNull();
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty template content", () => {
      const config = MODEL_CONFIG.groq;
      const result = generateTemplateContent("", config);
      expect(result).toBe("");
    });

    it("should handle template with no placeholders", () => {
      const config = MODEL_CONFIG.groq;
      const simpleTemplate = "const x = 1;";
      const result = generateTemplateContent(simpleTemplate, config);
      expect(result).toBe(simpleTemplate);
    });

    it("should handle partial config", () => {
      const partialConfig = {
        MODEL_NAME: "TestModel",
        MODEL_IMPORT_FUNCTION: "createTest",
      };
      const result = generateTemplateContent(templateContent, partialConfig);

      // Should replace what it can
      expect(result).toContain("TestModel");
      expect(result).toContain("createTest");

      // Should leave other placeholders unchanged
      expect(result).toContain("{{MODEL_IMPORT_PATH}}");
      expect(result).toContain("{{ENV_VAR_KEY}}");
    });
  });
});
