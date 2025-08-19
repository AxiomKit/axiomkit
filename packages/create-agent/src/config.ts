export const BASEDEPS_AXIOMKIT = {
  "@axiomkit/core": "^2.0.5",
  ai: "^5.0.5",
  chalk: "^5.4.1",
  typescript: "^5.8.3",
  zod: "^4.0.17",
  "@openrouter/ai-sdk-provider": "^1.1.0",
};

export const MODEL_DEPS_AXIOMKIT: Record<
  string,
  { pkg: string; version: string }
> = {
  groq: { pkg: "@ai-sdk/groq", version: "^2.0.11" },
  openai: { pkg: "@ai-sdk/openai", version: "^ 2.0.16" },
  anthropic: { pkg: "@ai-sdk/anthropic", version: "^2.0.5" },
  google: { pkg: "@ai-sdk/google", version: "^2.0.7" },
};

export const MODEL_CONFIG = {
  groq: {
    MODEL_NAME: "Groq",
    MODEL_IMPORT_FUNCTION: "createGroq",
    MODEL_IMPORT_PATH: "@ai-sdk/groq",
    ENV_VAR_KEY: "GROQ_API_KEY",
    MODEL_VARIABLE: "groq",
    MODEL_VERSION: "deepseek-r1-distill-llama-70b",
  },
  openai: {
    MODEL_NAME: "OpenAI",
    MODEL_IMPORT_FUNCTION: "createOpenAI",
    MODEL_IMPORT_PATH: "@ai-sdk/openai",
    ENV_VAR_KEY: "OPENAI_API_KEY",
    MODEL_VARIABLE: "openai",
    MODEL_VERSION: "gpt-4o",
  },
  anthropic: {
    MODEL_NAME: "Anthropic",
    MODEL_IMPORT_FUNCTION: "createAnthropic",
    MODEL_IMPORT_PATH: "@ai-sdk/anthropic",
    ENV_VAR_KEY: "ANTHROPIC_API_KEY",
    MODEL_VARIABLE: "anthropic",
    MODEL_VERSION: "claude-3-opus-20240229",
  },
  google: {
    MODEL_NAME: "Google",
    MODEL_IMPORT_FUNCTION: "createGoogle",
    MODEL_IMPORT_PATH: "@ai-sdk/google",
    ENV_VAR_KEY: "GOOGLE_API_KEY",
    MODEL_VARIABLE: "google",
    MODEL_VERSION: "gemini-1.5-pro",
  },
};
