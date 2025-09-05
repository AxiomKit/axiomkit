import chalk from "chalk";

/**
 * Gets the configured versions for all dependencies from config.ts
 * @param selectedExtensions Array of selected extensions to determine which packages to include
 * @param selectedModel The selected model provider to determine which AI SDK to include
 * @param verbose Whether to show detailed logging
 * @returns Object with package names and their configured versions
 */
export async function getConfiguredDependencies(
  selectedExtensions: string[],
  selectedModel: string,
  verbose: boolean = false
): Promise<Record<string, string>> {
  const log = (message: string) => {
    if (verbose) {
      console.log(chalk.gray(`🔍 ${message}`));
    }
  };

  // Import the configured dependencies from config.ts
  const { BASEDEPS_AXIOMKIT, MODEL_DEPS_AXIOMKIT } = await import(
    "./config.js"
  );

  // Base dependencies from config
  const baseDependencies = { ...BASEDEPS_AXIOMKIT };

  // Model-specific dependencies from config - only include the selected one
  const modelDependencies: Record<string, string> = {};
  const selected = MODEL_DEPS_AXIOMKIT[selectedModel];
  if (selected) {
    modelDependencies[selected.pkg] = selected.version;
  }

  // Extension-specific dependencies
  const extensionDependencies: Record<string, string> = {};

  if (selectedExtensions.includes("cli")) {
    extensionDependencies["@axiomkit/cli"] = "^0.0.15";
  }
  if (selectedExtensions.includes("discord")) {
    extensionDependencies["@axiomkit/discord"] = "^0.0.9";
    extensionDependencies["discord.js"] = "^14.18.0";
  }
  if (selectedExtensions.includes("telegram")) {
    extensionDependencies["@axiomkit/telegram"] = "^0.0.9";
    extensionDependencies["telegraf"] = "^4.16.3";
  }

  const allDependencies = {
    ...baseDependencies,
    ...modelDependencies,
    ...extensionDependencies,
  };

  log(
    `Using configured versions for ${
      Object.keys(allDependencies).length
    } packages (${selectedModel} model + ${
      selectedExtensions.length
    } extensions)...`
  );

  // Use configured versions directly without fetching from registry
  const finalDependencies: Record<string, string> = {};

  Object.entries(allDependencies).forEach(([packageName, version]) => {
    finalDependencies[packageName] = version;
    log(`Using configured version for ${packageName}: ${version}`);
  });

  log(`✅ Using configured versions from config.ts for all packages`);

  return finalDependencies;
}

/**
 * Validates a project name for directory creation
 * @param name The project name to validate
 * @returns Object with isValid boolean and error message if invalid
 */
export function validateProjectName(name: string): {
  isValid: boolean;
  error?: string;
} {
  // Check for empty name
  if (!name || name.trim() === "") {
    return { isValid: false, error: "Project name cannot be empty" };
  }

  // Check for invalid characters (platform agnostic)
  const invalidChars = /[<>:"/\\|?*\x00-\x1f]/;
  if (invalidChars.test(name)) {
    return {
      isValid: false,
      error: "Project name contains invalid characters",
    };
  }

  // Check for reserved names (Windows)
  const reservedNames = [
    "CON",
    "PRN",
    "AUX",
    "NUL",
    "COM1",
    "COM2",
    "COM3",
    "COM4",
    "COM5",
    "COM6",
    "COM7",
    "COM8",
    "COM9",
    "LPT1",
    "LPT2",
    "LPT3",
    "LPT4",
    "LPT5",
    "LPT6",
    "LPT7",
    "LPT8",
    "LPT9",
  ];
  if (reservedNames.includes(name.toUpperCase())) {
    return { isValid: false, error: "Project name is a reserved system name" };
  }

  // Check length (most filesystems support 255, but let's be conservative)
  if (name.length > 100) {
    return {
      isValid: false,
      error: "Project name is too long (max 100 characters)",
    };
  }

  // Check for names starting/ending with dots or spaces
  if (
    name.startsWith(".") ||
    name.endsWith(".") ||
    name.startsWith(" ") ||
    name.endsWith(" ")
  ) {
    return {
      isValid: false,
      error: "Project name cannot start or end with dots or spaces",
    };
  }

  return { isValid: true };
}

/**
 * Validates a model provider name
 * @param model The model name to validate
 * @returns Object with isValid boolean and error message if invalid
 */
export function validateModel(model: string): {
  isValid: boolean;
  error?: string;
} {
  const validModels = ["openai", "groq", "anthropic", "google"];

  if (!model || model.trim() === "") {
    return { isValid: false, error: "Model provider cannot be empty" };
  }

  if (!validModels.includes(model.toLowerCase())) {
    return {
      isValid: false,
      error: `Invalid model provider '${model}'. Valid options: ${validModels.join(
        ", "
      )}`,
    };
  }

  return { isValid: true };
}

/**
 * Generates the content for an agent template by replacing placeholders
 * @param templateContent The original template content with placeholders
 * @param modelConfig The model-specific configuration values
 * @param extensionImports Array of extension import statements
 * @param extensionsList Array of extension variable names
 * @returns The processed template content
 */
export function generateTemplateContent(
  templateContent: string,
  modelConfig: Record<string, string>,
  extensionImports: string[] = [],
  extensionsList: string[] = []
): string {
  // Replace model-specific placeholders
  let processedContent = templateContent;

  // Replace placeholders with model-specific values
  Object.entries(modelConfig).forEach(([key, value]) => {
    const placeholder = new RegExp(`{{${key}}}`, "g");
    processedContent = processedContent.replace(placeholder, value);
  });

  // Replace extension imports if specified
  if (extensionImports.length > 0) {
    processedContent = processedContent.replace(
      `import { cliExtension } from "@axiomkit/cli";`,
      extensionImports.join("\n")
    );
  }

  if (extensionsList.length > 0) {
    processedContent = processedContent.replace(
      "extensions: [cli]",
      `extensions: [${extensionsList.join(", ")}]`
    );
  }

  // Add header comment
  const headerComment = `/**
 * Axiomkit agent with ${extensionsList.join(", ")} extension(s)
 * Using ${modelConfig.MODEL_NAME} as the model provider
 */`;

  processedContent = processedContent.replace(
    /\/\*\*[\s\S]*?\*\//,
    headerComment
  );

  return processedContent;
}

/**
 * Creates environment variables content for the .env.example file
 * @param selectedModel The selected model provider
 * @param selectedExtensions Array of selected extensions
 * @returns The content for the .env.example file
 */
export function createEnvVariables(
  selectedModel: string,
  selectedExtensions: string[]
): string {
  const envVariables = ["# Axiomkit Environment Variables\n"];

  // Model-specific configuration - only for selected model
  envVariables.push("# Model Configuration");
  switch (selectedModel) {
    case "groq":
      envVariables.push("GROQ_API_KEY=your_groq_api_key");
      break;
    case "openai":
      envVariables.push("OPENAI_API_KEY=your_openai_api_key");
      break;
    case "anthropic":
      envVariables.push("ANTHROPIC_API_KEY=your_anthropic_api_key");
      break;
    case "google":
      envVariables.push("GOOGLE_API_KEY=your_google_api_key");
      break;
  }

  if (selectedExtensions.includes("telegram")) {
    envVariables.push("# Telegram Configuration");
    envVariables.push(
      "# TELEGRAM_STARTUP_CHAT_ID: Chat ID where startup notifications will be sent"
    );
    envVariables.push("TELEGRAM_STARTUP_CHAT_ID=your_startup_chat_id");

    envVariables.push(
      "# GramJS Configuration (required for both bot and user clients)"
    );
    envVariables.push(
      "# TELEGRAM_TOKEN: Bot token from @BotFather (required for bot mode)"
    );
    envVariables.push("TELEGRAM_TOKEN=your_telegram_token");

    envVariables.push("# Get these from https://my.telegram.org/apps");
    envVariables.push("TELEGRAM_API_ID=your_api_id");
    envVariables.push("TELEGRAM_API_HASH=your_api_hash");

    envVariables.push("# Optional: Session string for user authentication");
    envVariables.push(
      "# After first successful interactive login, the app will provide a session string"
    );
    envVariables.push(
      "# Save it here to avoid interactive login in subsequent runs"
    );
    envVariables.push("TELEGRAM_USER_SESSION=your_session_string\n");
  }
  if (selectedExtensions.includes("discord")) {
    envVariables.push("# Discord Configuration");
    envVariables.push(
      "# Discord Bot Token (https://discord.com/developers/applications)"
    );
    envVariables.push(
      "# Required Gateway Intents: Server Members, Message Content, Presence"
    );
    envVariables.push("DISCORD_BOT_TOKEN=your_discord_token");
    envVariables.push("DISCORD_BOT_NAME=your_bot_name\n");
  }
  // General configuration (always included)
  envVariables.push("# General Configuration");
  envVariables.push("DRY_RUN=1\n");

  return envVariables.join("\n");
}

/**
 * Creates a README file content for the agent
 * @param projectName The name of the project
 * @param selectedExtensions Array of selected extensions
 * @param selectedModel The selected model provider
 * @returns The content for the README.md file
 */
export function createReadme(
  projectName: string,
  selectedExtensions: string[],
  selectedModel: string
): string {
  return `# ${projectName}

A Axiomkit agent with the following extensions:
${selectedExtensions.map((ext) => `- ${ext}`).join("\n")}

## Features

- Uses ${selectedModel} as the model provider
- Includes context for managing goals and tasks
- Provides actions for adding and completing tasks

## Getting Started

1. Copy \`.env.example\` to \`.env\` and fill in the required values.
2. Install dependencies:

\`\`\`
bun install
\`\`\`

3. Run the agent:

\`\`\`
bun start
\`\`\`

## Customizing Your Agent

You can modify the \`index.ts\` file to add more contexts, actions, or change the model configuration.
`;
}
