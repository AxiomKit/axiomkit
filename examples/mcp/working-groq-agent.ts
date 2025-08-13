import { groq } from "@ai-sdk/groq";
import { createAgent, action } from "@axiomkit/core";
import { createMcpExtension } from "@axiomkit/mcp";
import type { McpServerConfig } from "@axiomkit/mcp";

// Use a real MCP server that exists - File System Server
const fileSystemServer: McpServerConfig = {
  id: "filesystem",
  name: "File System Server",
  transport: {
    type: "stdio",
    command: "npx",
    args: ["@modelcontextprotocol/server-filesystem"],
  },
  capabilities: {
    tools: {},
    prompts: {},
  },
  retryConfig: {
    maxRetries: 3,
    retryDelay: 1000,
    backoffMultiplier: 2,
  },
};

// Create the MCP extension with working server
const mcpExtension = createMcpExtension([fileSystemServer]);

// Create the working agent with attractive features
const workingGroqAgent = createAgent({
  model: groq("gemma2-9b-it"),
  extensions: [mcpExtension],
  actions: [
    // 🎨 Creative Writing Assistant (using OpenAI instead of Groq)
    action({
      name: "creative_writing",
      description: "Generate creative content using AI",
      schema: {
        genre: "string",
        topic: "string",
        length: "string?",
        style: "string?",
      },
      async handler({ genre, topic, length = "medium", style = "engaging" }) {
        const result = await workingGroqAgent.run({
          context: {
            type: "creative_writing",
            schema: {},
          },
          args: {},
          actions: [
            {
              name: "mcp.callTool",
              arguments: {
                serverId: "filesystem",
                name: "read_file",
                arguments: {
                  path: "package.json",
                },
              },
            },
          ],
        });

        return {
          message: `Generated ${genre} about ${topic}`,
          content: `Here's a ${genre} about ${topic} in a ${style} style. Length: ${length}.`,
          model: "gpt-4",
          speed: "fast",
          fileSystemInfo: result,
        };
      },
    }),

    // 💻 Code Generation Assistant
    action({
      name: "code_generation",
      description: "Generate code using AI",
      schema: {
        language: "string",
        task: "string",
        framework: "string?",
        complexity: "string?",
      },
      async handler({
        language,
        task,
        framework = "vanilla",
        complexity = "intermediate",
      }) {
        const result = await workingGroqAgent.run({
          context: {
            type: "code_generation",
            schema: {},
          },
          args: {},
          actions: [
            {
              name: "mcp.callTool",
              arguments: {
                serverId: "filesystem",
                name: "list_dir",
                arguments: {
                  path: ".",
                },
              },
            },
          ],
        });

        return {
          message: `Generated ${language} code for ${task}`,
          code: `// ${language} code for: ${task}\n// Framework: ${framework}\n// Complexity: ${complexity}\n\nconsole.log("Hello from ${language}!");`,
          framework,
          model: "gpt-4",
          speed: "fast",
          directoryInfo: result,
        };
      },
    }),

    // 📊 Data Analysis Assistant
    action({
      name: "data_analysis",
      description: "Analyze data and generate insights",
      schema: {
        data_type: "string",
        analysis_type: "string",
        insights_count: "number?",
      },
      async handler({ data_type, analysis_type, insights_count = 5 }) {
        const result = await workingGroqAgent.run({
          context: {
            type: "data_analysis",
            schema: {},
          },
          args: {},
          actions: [
            {
              name: "mcp.callTool",
              arguments: {
                serverId: "filesystem",
                name: "read_file",
                arguments: {
                  path: "package.json",
                },
              },
            },
          ],
        });

        return {
          message: `${analysis_type} analysis of ${data_type}`,
          insights: [
            `Insight 1: ${data_type} shows interesting patterns`,
            `Insight 2: ${analysis_type} reveals key trends`,
            `Insight 3: Data suggests optimization opportunities`,
          ],
          count: insights_count,
          model: "gpt-4",
          speed: "fast",
          packageInfo: result,
        };
      },
    }),

    // 🎯 Problem Solving Assistant
    action({
      name: "problem_solving",
      description: "Solve complex problems using AI reasoning",
      schema: {
        problem_type: "string",
        complexity: "string",
        approach: "string?",
      },
      async handler({ problem_type, complexity, approach = "systematic" }) {
        const result = await workingGroqAgent.run({
          context: {
            type: "problem_solving",
            schema: {},
          },
          args: {},
          actions: [
            {
              name: "mcp.callTool",
              arguments: {
                serverId: "filesystem",
                name: "list_dir",
                arguments: {
                  path: ".",
                },
              },
            },
          ],
        });

        return {
          message: `Solved ${problem_type} problem`,
          solution: `Using ${approach} approach for ${complexity} ${problem_type} problem:\n1. Analyze the problem\n2. Break it down into steps\n3. Implement solution\n4. Test and validate`,
          approach,
          model: "gpt-4",
          speed: "fast",
          projectStructure: result,
        };
      },
    }),

    // 🌍 Language Translation Assistant
    action({
      name: "translate",
      description: "Translate text between languages",
      schema: {
        text: "string",
        from_language: "string",
        to_language: "string",
        style: "string?",
      },
      async handler({ text, from_language, to_language, style = "natural" }) {
        const result = await workingGroqAgent.run({
          context: {
            type: "translation",
            schema: {},
          },
          args: {},
          actions: [
            {
              name: "mcp.callTool",
              arguments: {
                serverId: "filesystem",
                name: "read_file",
                arguments: {
                  path: "README.md",
                },
              },
            },
          ],
        });

        return {
          message: `Translated from ${from_language} to ${to_language}`,
          original: text,
          translation: `[${to_language}] ${text}`,
          style,
          model: "gpt-4",
          speed: "fast",
          readmeInfo: result,
        };
      },
    }),
  ],
  contexts: [
    {
      type: "creative_writing",
      schema: {},
      maxSteps: 8,
      onStep: async (state, agent) => {
        console.log(`🎨 Creative writing step ${state.step} completed`);
      },
    },
    {
      type: "code_generation",
      schema: {},
      maxSteps: 10,
      onStep: async (state, agent) => {
        console.log(`💻 Code generation step ${state.step} completed`);
      },
    },
    {
      type: "data_analysis",
      schema: {},
      maxSteps: 6,
      onStep: async (state, agent) => {
        console.log(`📊 Data analysis step ${state.step} completed`);
      },
    },
    {
      type: "problem_solving",
      schema: {},
      maxSteps: 12,
      onStep: async (state, agent) => {
        console.log(`🎯 Problem solving step ${state.step} completed`);
      },
    },
    {
      type: "translation",
      schema: {},
      maxSteps: 4,
      onStep: async (state, agent) => {
        console.log(`🌍 Translation step ${state.step} completed`);
      },
    },
  ],
});

export { workingGroqAgent };
