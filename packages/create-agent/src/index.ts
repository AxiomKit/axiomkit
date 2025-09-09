import path from "path";
import fs from "fs-extra";
import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import { execa } from "execa";
import prompts from "prompts";
import { fileURLToPath } from "url";
import {
  generateTemplateContent,
  createEnvVariables,
  createReadme,
  validateProjectName,
  validateModel,
  getConfiguredDependencies,
} from "./utils";
import { BASEDEPS_AXIOMKIT, MODEL_CONFIG, MODEL_DEPS_AXIOMKIT } from "./config";

// Define __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define the CLI program
const program = new Command()
  .name("create-agent")
  .description(
    "🤖 Initialize a new AxiomKit AI agent with configurable providers and model providers"
  )
  .version("0.0.2")
  .argument(
    "[directory]",
    "📁 Target directory for agent (defaults to current)"
  )
  .option("--cli", "🔧 Add CLI provider for command-line interface support")
  .option("--telegram", "💬 Add Telegram provider for messaging integration")
  .option("--discord", "💬 Add Discord provider for messaging integration")
  .option("--all", "📦 Add all available providers")
  .option(
    "--model <model>",
    "🧠 Set model provider (options: openai, groq, anthropic, google)"
  )
  .option("--skip-install", "Skip installing dependencies")
  .option("--verbose", ":🔍 Show detailed output during creation")
  .addHelpText(
    "after",
    `
Examples:
  $ create-agent my-bot                    Create agent in ./my-bot (will prompt for model)
  $ create-agent --telegram                Create agent with Twitter 
  $ create-agent --model openai --all      Create agent with OpenAI and all providers
  $ create-agent . --cli                   Create agent in current directory with CLI only

Available providers:
  cli       Command-line interface for terminal interactions
  telegram  Telegram bot for messaging and notifications

Supported Models:
  groq      Groq's fast inference (free tier available)
  google    Google Gemini models (requires API key)
  openai    OpenAI GPT models (requires API key)

Environment Setup:
  After creation, copy .env.example to .env and configure your API keys.
  Each provider may require additional environment variables.
`
  );

export async function main(
  testArgs?: string[],
  testOpts?: Record<string, any>,
  testTemplateContent?: string
) {
  if (!testArgs && !testOpts) {
    program.parse(process.argv);
  }

  const options = testOpts || program.opts();
  const targetDir = (testArgs && testArgs[0]) || program.args[0] || ".";
  const cwd = process.cwd();
  const targetPath = path.resolve(cwd, targetDir);

  if (targetDir !== ".") {
    const validation = validateProjectName(path.basename(targetPath));
    if (!validation.isValid) {
      console.error(chalk.red(`❌ Invalid project name: ${validation.error}`));
      console.log(chalk.yellow(`💡 Try: create-agent my-agent`));
      return;
    }
  }

  // Enhanced verbose logging helper
  const log = (message: string, force = false) => {
    if (options.verbose || force) {
      console.log(chalk.gray(`🔍 ${message}`));
    }
  };

  log(`Target directory: ${targetPath}`);
  log(`Model provider: ${options.model || "not specified - will prompt"}`);

  if (fs.existsSync(targetPath)) {
    const files = await fs.readdir(targetPath);
    if (files.length > 0) {
      console.log(
        chalk.yellow(`⚠️  Directory ${chalk.cyan(targetPath)} is not empty.`)
      );
      console.log(
        chalk.gray(
          `   Found ${files.length} file(s): ${files.slice(0, 3).join(", ")}${
            files.length > 3 ? "..." : ""
          }`
        )
      );

      const { proceed } = await prompts({
        type: "confirm",
        name: "proceed",
        message: "Continue and potentially overwrite existing files?",
        initial: false,
      });

      if (!proceed) {
        console.log(chalk.red("❌ Operation cancelled."));
        return;
      }
    }
  } else {
    log(`Creating directory: ${targetPath}`);
    await fs.mkdir(targetPath, { recursive: true });
  }

  console.log();
  console.log(chalk.bold("🚀 Initializing new AxiomKit agent..."));
  console.log();

  // Determine selected providers
  const availableProviders = ["cli", "twitter", "discord", "telegram"];
  let selectedProviders = [];

  if (options.all) {
    selectedProviders = [...availableProviders];
    console.log(chalk.green("📦 Including all providers available"));
  } else {
    // Collect providers from command line options
    selectedProviders = availableProviders.filter((ext) => options[ext]);

    // If no providers were selected via flags, prompt the user
    if (selectedProviders.length === 0) {
      console.log(chalk.cyan("🔧 Choose providers for your agent:"));
      const { providers } = await prompts({
        type: "multiselect",
        name: "providers",
        message: "Select providers to include",
        choices: [
          {
            title: "CLI",
            value: "cli",
            description: "Command-line interface for terminal interactions",
          },
          {
            title: "Telegram",
            value: "telegram",
            description: "Telegram bot for messaging",
          },
        ],
        hint: "Use space to select, enter to confirm",
      });

      if (!providers || providers.length === 0) {
        console.log(
          chalk.yellow(
            "⚠️  No providers selected. Including CLI provider by default."
          )
        );
        selectedProviders = ["cli"];
      } else {
        selectedProviders = providers;
      }
    }
  }

  log(`Selected provider: ${selectedProviders.join(", ")}`);

  let selectedModel = options.model;
  if (selectedModel) {
    const modelValidation = validateModel(selectedModel);
    if (!modelValidation.isValid) {
      console.error(chalk.red(`❌ ${modelValidation.error}`));
      console.log(
        chalk.yellow(`💡 Try: --model groq (or openai, anthropic, google)`)
      );
      return;
    }
  } else {
    // No model specified, prompt the user to select one
    console.log(chalk.cyan("🤖 Choose your AI model provider:"));
    const { model } = await prompts({
      type: "select",
      name: "model",
      message: "Select the model provider to use",
      choices: [
        {
          title: "Groq",
          value: "groq",
          description: "Fast inference, free tier available",
        },
        {
          title: "OpenAI",
          value: "openai",
          description: "GPT models, requires API key",
        },
        {
          title: "Anthropic",
          value: "anthropic",
          description: "Claude models, requires API key",
        },
        {
          title: "Google",
          value: "google",
          description: "Gemini models, requires API key",
        },
      ],
      initial: 0,
    });
    selectedModel = model;
  }

  if (!selectedModel) {
    console.error(
      chalk.red("❌ Model provider not selected. Operation cancelled.")
    );
    return;
  }

  log(`Selected model: ${selectedModel}`);

  // Create package.json
  const spinner = ora("📦 Loading configured dependency versions").start();

  let dependencies: Record<string, string>;
  try {
    dependencies = await getConfiguredDependencies(
      selectedProviders,
      selectedModel,
      options.verbose
    );
    spinner.succeed(chalk.green("✅ Loaded configured dependency versions"));
  } catch (error) {
    spinner.fail(chalk.yellow("⚠️  Using fallback dependency versions"));
    log(
      `Error loading dependencies: ${
        error instanceof Error ? error.message : String(error)
      }`
    );

    const modelDep: Record<string, string> = {};
    const selected = MODEL_DEPS_AXIOMKIT[selectedModel];

    if (selected) {
      modelDep[selected.pkg] = selected.version;
    }
    dependencies = { ...BASEDEPS_AXIOMKIT, ...modelDep };
  }

  spinner.start("Creating package.json");
  const packageJson: {
    name: string;
    version: string;
    type: string;
    scripts: Record<string, string>;
    dependencies: Record<string, string>;
  } = {
    name: path.basename(targetPath),
    version: "0.1.0",
    type: "module",
    scripts: {
      start: "bun run index.ts",
      build: "tsc",
    },
    dependencies,
  };

  try {
    await fs.writeFile(
      path.join(targetPath, "package.json"),
      JSON.stringify(packageJson, null, 2)
    );
    spinner.succeed(chalk.green("✅ Created package.json"));
    log(`Package name: ${packageJson.name}`);
  } catch (error) {
    spinner.fail(chalk.red("❌ Failed to create package.json"));
    console.error(
      chalk.red(
        `Error: ${error instanceof Error ? error.message : String(error)}`
      )
    );
    return;
  }

  // Create tsconfig.json
  spinner.start("⚙️  Creating TypeScript configuration");
  const tsconfigJson = {
    compilerOptions: {
      target: "ES2020",
      module: "NodeNext",
      moduleResolution: "NodeNext",
      esModuleInterop: true,
      strict: true,
      skipLibCheck: true,
      outDir: "dist",
    },
    include: ["*.ts"],
    exclude: ["node_modules"],
  };

  try {
    await fs.writeFile(
      path.join(targetPath, "tsconfig.json"),
      JSON.stringify(tsconfigJson, null, 2)
    );
    spinner.succeed(chalk.green("✅ Created TypeScript configuration"));
  } catch (error) {
    spinner.fail(chalk.red("❌ Failed to create tsconfig.json"));
    console.error(
      chalk.red(
        `Error: ${error instanceof Error ? error.message : String(error)}`
      )
    );
    return;
  }

  // Create .gitignore
  spinner.start("⚙️  Creating .gitignore configuration");

  const gitIgnoreContent = `
logs/
*.log
npm-debug.log*
yarn-debug.log*
pnpm-debug.log*
lerna-debug.log*

# Dependency directories
node_modules/
jspm_packages/

# TypeScript cache and build artifacts
*.tsbuildinfo
/build/
/dist/
/tmp/
/out/

# npm package manager cache
.npm/

# ------------------------------------
# Environment Variables
# ------------------------------------
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
.DS_Store

`;

  try {
    await fs.writeFile(
      path.join(targetPath, ".gitignore"),
      gitIgnoreContent.trim()
    );
    spinner.succeed(chalk.green("✅ Created Git Ignore configuration"));
  } catch (error) {
    spinner.fail(chalk.red("❌ Failed to create .gitignore"));
    console.error(
      chalk.red(
        `Error: ${error instanceof Error ? error.message : String(error)}`
      )
    );
    return;
  }

  // Copy template file based on selected model
  spinner.start(
    `🤖 Creating agent with ${chalk.cyan(selectedModel)} model and ${chalk.cyan(
      selectedProviders.length
    )} provider(s)`
  );

  let templateContent: string;

  if (testTemplateContent) {
    templateContent = testTemplateContent;
  } else {
    const templateFile = path.join(
      __dirname,
      "..",
      "templates",
      "basic",
      "template.ts"
    );

    if (!fs.existsSync(templateFile)) {
      spinner.fail(chalk.red("❌ Template file not found"));
      console.error(
        chalk.red(
          `Error: Template file not found at ${templateFile}. Please check your installation.`
        )
      );
      return;
    }

    try {
      // Read the template file
      templateContent = await fs.readFile(templateFile, "utf-8");
      log(`Template loaded from: ${templateFile}`);
    } catch (error) {
      spinner.fail(chalk.red("❌ Failed to read template file"));
      console.error(
        chalk.red(
          `Error: ${error instanceof Error ? error.message : String(error)}`
        )
      );
      return;
    }
  }

  const config = MODEL_CONFIG[selectedModel as keyof typeof MODEL_CONFIG];

  const providerImports: string[] = [];
  const providersList: string[] = [];

  for (const prov of selectedProviders) {
    if (prov === "cli") {
      providerImports.push(`import { cliTool } from "@axiomkit/cli";`);
      providersList.push("cliTool");
    } else if (prov === "twitter") {
      providerImports.push(`import { twitter } from "@axiomkit/twitter";`);
      providersList.push("twitter");
    } else if (prov === "discord") {
      providerImports.push(`import { discord } from "@axiomkit/discord";`);
      providersList.push("discord");
    } else if (prov === "telegram") {
      providerImports.push(`import { telegram } from "@axiomkit/telegram";`);
      providersList.push("telegram");
    }
  }

  // Generate the template content with all replacements
  try {
    const processedContent = generateTemplateContent(
      templateContent,
      config,
      providerImports,
      providersList
    );

    // Write the modified template to the target directory
    await fs.writeFile(path.join(targetPath, "index.ts"), processedContent);
    spinner.succeed(
      chalk.green(
        `✅ Created agent with ${selectedModel} model and providers: ${chalk.cyan(
          selectedProviders.join(", ")
        )}`
      )
    );
    log(`Providers configured: ${selectedProviders.join(", ")}`);
  } catch (error) {
    spinner.fail(chalk.red("❌ Failed to create agent file"));
    console.error(
      chalk.red(
        `Error: ${error instanceof Error ? error.message : String(error)}`
      )
    );
    return;
  }

  // Create .env file with required environment variables
  spinner.start("🔐 Creating environment configuration");
  try {
    const envContent = createEnvVariables(selectedModel, selectedProviders);
    await fs.writeFile(path.join(targetPath, ".env.example"), envContent);
    spinner.succeed(
      chalk.green("✅ Created environment configuration (.env.example)")
    );
    log(
      `Environment variables for: ${selectedModel}, ${selectedProviders.join(
        ", "
      )}`
    );
  } catch (error) {
    spinner.fail(chalk.red("❌ Failed to create .env.example"));
    console.error(
      chalk.red(
        `Error: ${error instanceof Error ? error.message : String(error)}`
      )
    );
  }

  // Create README
  spinner.start("📖 Creating documentation");
  try {
    const readmeContent = createReadme(
      path.basename(targetPath),
      selectedProviders,
      selectedModel
    );
    await fs.writeFile(path.join(targetPath, "README.md"), readmeContent);
    spinner.succeed(chalk.green("✅ Created documentation (README.md)"));
  } catch (error) {
    spinner.fail(chalk.red("❌ Failed to create README"));
    console.error(
      chalk.red(
        `Error: ${error instanceof Error ? error.message : String(error)}`
      )
    );
  }

  // Install dependencies - simplified to directly use pnpm
  if (!options.skipInstall) {
    spinner.start("📦 Installing dependencies with pnpm");
    try {
      await execa("pnpm", ["install"], { cwd: targetPath });

      // Verify node_modules exists
      const nodeModulesPath = path.join(targetPath, "node_modules");
      const nodeModulesExists = await fs.pathExists(nodeModulesPath);

      if (nodeModulesExists) {
        spinner.succeed(chalk.green("✅ Installed dependencies"));
        log(`Dependencies installed in: ${nodeModulesPath}`);
      } else {
        spinner.fail(
          chalk.yellow(
            "⚠️  Dependencies installed but node_modules directory wasn't found"
          )
        );
        console.log(
          chalk.yellow(
            "💡 You can install dependencies manually by running 'pnpm install' in the project directory."
          )
        );
      }
    } catch (error: unknown) {
      spinner.fail(chalk.red("❌ Failed to install dependencies"));
      console.error(
        chalk.red(
          `Error: ${error instanceof Error ? error.message : String(error)}`
        )
      );
      console.log(
        chalk.yellow(
          "💡 You can install dependencies manually by running 'pnpm install' in the project directory."
        )
      );
    }
  } else {
    console.log(
      chalk.yellow("⏭️  Skipping dependency installation (--skip-install)")
    );
  }

  console.log();
  console.log(
    chalk.green.bold("🎉 Your Axiomkit agent has been created successfully!")
  );
  console.log();

  console.log(chalk.cyan("📋 Summary:"));
  console.log(
    `   ${chalk.gray("Project:")} ${chalk.white(path.basename(targetPath))}`
  );
  console.log(`   ${chalk.gray("Location:")} ${chalk.white(targetPath)}`);
  console.log(`   ${chalk.gray("Model:")} ${chalk.white(selectedModel)}`);
  console.log(
    `   ${chalk.gray("Providers:")} ${chalk.white(
      selectedProviders.join(", ")
    )}`
  );
  console.log();

  console.log(chalk.cyan("🚀 Next steps:"));

  if (targetDir !== ".") {
    console.log(`   ${chalk.gray("1.")} cd ${chalk.white(targetDir)}`);
  }

  console.log(
    `   ${chalk.gray(targetDir !== "." ? "2." : "1.")} cp .env.example .env`
  );
  console.log(
    `   ${chalk.gray(targetDir !== "." ? "3." : "2.")} ${chalk.gray(
      "# Configure your API keys in .env"
    )}`
  );

  if (options.skipInstall) {
    console.log(
      `   ${chalk.gray(targetDir !== "." ? "4." : "3.")} pnpm install`
    );
    console.log(`   ${chalk.gray(targetDir !== "." ? "5." : "4.")} npm start`);
  } else {
    console.log(`   ${chalk.gray(targetDir !== "." ? "4." : "3.")} npm start`);
  }

  console.log();
  console.log(
    chalk.gray(
      "💡 Need help? Check the README.md file for detailed setup instructions."
    )
  );
  console.log();
}

// Directly run the main function when this file is executed directly
if (
  import.meta.url &&
  process.argv[1] &&
  (import.meta.url.endsWith(process.argv[1]) ||
    process.argv[1].endsWith("index.js") ||
    process.argv[1].endsWith("create-agent"))
) {
  main().catch((error) => {
    console.error(
      chalk.red(
        `Error: ${error instanceof Error ? error.message : String(error)}`
      )
    );
    process.exit(1);
  });
}
