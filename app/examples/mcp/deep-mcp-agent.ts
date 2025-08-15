import { createAgent, action } from "@axiomkit/core";
import { createMcpExtension } from "@axiomkit/mcp";
import type { McpServerConfig } from "@axiomkit/mcp";

// Comprehensive MCP Server Configurations
const mcpServers: McpServerConfig[] = [
  // File System Server - Basic file operations
  {
    id: "filesystem",
    name: "File System Server",
    transport: {
      type: "stdio",
      command: "npx",
      args: ["@modelcontextprotocol/server-filesystem"],
    },
    capabilities: { tools: {}, prompts: {} },
    retryConfig: { maxRetries: 3, retryDelay: 1000, backoffMultiplier: 2 },
  },

  // Brave Search Server - Web search capabilities
  {
    id: "brave-search",
    name: "Brave Search Server",
    transport: {
      type: "stdio",
      command: "npx",
      args: ["@modelcontextprotocol/server-brave-search"],
      env: {
        BRAVE_API_KEY: process.env.BRAVE_API_KEY || "",
      },
    },
    capabilities: { tools: {}, prompts: {} },
    retryConfig: { maxRetries: 3, retryDelay: 1000, backoffMultiplier: 2 },
  },

  // PostgreSQL Server - Database operations
  {
    id: "postgres",
    name: "PostgreSQL Server",
    transport: {
      type: "stdio",
      command: "npx",
      args: [
        "@modelcontextprotocol/server-postgres",
        process.env.DATABASE_URL || "",
      ],
    },
    capabilities: { tools: {}, prompts: {} },
    retryConfig: { maxRetries: 3, retryDelay: 1000, backoffMultiplier: 2 },
  },
];

// Create the MCP extension with all servers
const mcpExtension = createMcpExtension(mcpServers);

// Create the Deep MCP Agent with comprehensive functionality
const deepMcpAgent = createAgent({
  model: {
    provider: "groq",
    name: "gemma2-9b-it",
    apiKey: process.env.GROQ_API_KEY,
  },
  extensions: [mcpExtension],
  actions: [
    // 🔍 Advanced Search and Research
    action({
      name: "research_topic",
      description: "Conduct comprehensive research using multiple MCP servers",
      schema: {
        topic: "string",
        search_depth: "string?",
        include_code: "boolean?",
        save_results: "boolean?",
      },
      async handler({
        topic,
        search_depth = "comprehensive",
        include_code = true,
        save_results = true,
      }) {
        const results = await deepMcpAgent.run({
          context: { type: "research", schema: {} },
          args: {},
          actions: [
            // Search for information
            {
              name: "mcp.callTool",
              arguments: {
                serverId: "brave-search",
                name: "search",
                arguments: {
                  query: topic,
                  count: 10,
                },
              },
            },

            // Save research to database
            ...(save_results
              ? [
                  {
                    name: "mcp.callTool",
                    arguments: {
                      serverId: "postgres",
                      name: "execute_sql",
                      arguments: {
                        sql: `INSERT INTO research (topic, search_depth, created_at) VALUES ('${topic}', '${search_depth}', NOW())`,
                      },
                    },
                  },
                ]
              : []),
          ],
        });

        return {
          message: `Research completed for: ${topic}`,
          topic,
          search_depth,
          include_code,
          results_count: results?.length || 0,
          saved_to_db: save_results,
          framework: "AxiomKit",
          mcp_servers_used: ["brave-search", "postgres"],
        };
      },
    }),

    // 💾 Data Management and Storage
    action({
      name: "manage_data",
      description: "Comprehensive data management using MCP servers",
      schema: {
        operation: "string", // "store", "retrieve", "analyze", "backup"
        data_type: "string",
        data: "string?",
        query: "string?",
      },
      async handler({ operation, data_type, data, query }) {
        const results = await deepMcpAgent.run({
          context: { type: "data_management", schema: {} },
          args: {},
          actions: [
            // Store data in PostgreSQL
            ...(operation === "store"
              ? [
                  {
                    name: "mcp.callTool",
                    arguments: {
                      serverId: "postgres",
                      name: "execute_sql",
                      arguments: {
                        sql: `INSERT INTO ${data_type} (content, created_at) VALUES ('${data}', NOW())`,
                      },
                    },
                  },
                ]
              : []),
            // Retrieve data from PostgreSQL
            ...(operation === "retrieve"
              ? [
                  {
                    name: "mcp.callTool",
                    arguments: {
                      serverId: "postgres",
                      name: "execute_sql",
                      arguments: {
                        sql:
                          query ||
                          `SELECT * FROM ${data_type} ORDER BY created_at DESC LIMIT 10`,
                      },
                    },
                  },
                ]
              : []),
            // Analyze data using file system
            ...(operation === "analyze"
              ? [
                  {
                    name: "mcp.callTool",
                    arguments: {
                      serverId: "filesystem",
                      name: "read_file",
                      arguments: {
                        path: `./data/${data_type}.json`,
                      },
                    },
                  },
                ]
              : []),
          ],
        });

        return {
          message: `${operation} operation completed for ${data_type}`,
          operation,
          data_type,
          results_count: results?.length || 0,
          framework: "AxiomKit",
          mcp_servers_used: ["postgres", "filesystem"],
        };
      },
    }),

    // 🔧 Code Development and Management
    action({
      name: "code_development",
      description: "Full-stack code development using MCP integration",
      schema: {
        project_type: "string", // "web", "api", "library", "cli"
        language: "string",
        features: "string[]",
      },
      async handler({ project_type, language, features }) {
        const results = await deepMcpAgent.run({
          context: { type: "code_development", schema: {} },
          args: {},
          actions: [
            // Create project structure
            {
              name: "mcp.callTool",
              arguments: {
                serverId: "filesystem",
                name: "write_file",
                arguments: {
                  path: `./projects/${project_type}-${language}/package.json`,
                  content: JSON.stringify(
                    {
                      name: `${project_type}-${language}`,
                      version: "1.0.0",
                      type: "module",
                      dependencies: {},
                    },
                    null,
                    2
                  ),
                },
              },
            },
            // Create README
            {
              name: "mcp.callTool",
              arguments: {
                serverId: "filesystem",
                name: "write_file",
                arguments: {
                  path: `./projects/${project_type}-${language}/README.md`,
                  content: `# ${project_type} Project in ${language}\n\nFeatures: ${features.join(
                    ", "
                  )}\n\nBuilt with AxiomKit + MCP`,
                },
              },
            },
          ],
        });

        return {
          message: `Code development project created: ${project_type}-${language}`,
          project_type,
          language,
          features,
          framework: "AxiomKit",
          mcp_servers_used: ["filesystem"],
        };
      },
    }),

    // 📊 Analytics and Reporting
    action({
      name: "generate_analytics",
      description:
        "Generate comprehensive analytics using multiple data sources",
      schema: {
        report_type: "string", // "performance", "usage", "trends", "custom"
        data_sources: "string[]",
        time_range: "string?",
      },
      async handler({ report_type, data_sources, time_range = "30d" }) {
        const results = await deepMcpAgent.run({
          context: { type: "analytics", schema: {} },
          args: {},
          actions: [
            // Query database for analytics data
            {
              name: "mcp.callTool",
              arguments: {
                serverId: "postgres",
                name: "execute_sql",
                arguments: {
                  sql: `SELECT * FROM analytics WHERE report_type = '${report_type}' AND created_at >= NOW() - INTERVAL '${time_range}'`,
                },
              },
            },
            // Search for industry benchmarks
            {
              name: "mcp.callTool",
              arguments: {
                serverId: "brave-search",
                name: "search",
                arguments: {
                  query: `${report_type} analytics benchmarks ${data_sources.join(
                    " "
                  )}`,
                  count: 5,
                },
              },
            },
            // Save report to file system
            {
              name: "mcp.callTool",
              arguments: {
                serverId: "filesystem",
                name: "write_file",
                arguments: {
                  path: `./reports/${report_type}-${Date.now()}.json`,
                  content: JSON.stringify(
                    {
                      report_type,
                      data_sources,
                      time_range,
                      generated_at: new Date().toISOString(),
                      framework: "AxiomKit",
                    },
                    null,
                    2
                  ),
                },
              },
            },
          ],
        });

        return {
          message: `Analytics report generated: ${report_type}`,
          report_type,
          data_sources,
          time_range,
          results_count: results?.length || 0,
          framework: "AxiomKit",
          mcp_servers_used: ["postgres", "brave-search", "filesystem"],
        };
      },
    }),

    // 🔄 Workflow Automation
    action({
      name: "automate_workflow",
      description: "Automate complex workflows using MCP server orchestration",
      schema: {
        workflow_type: "string", // "ci_cd", "data_pipeline", "monitoring", "backup"
        steps: "string[]",
        schedule: "string?",
      },
      async handler({ workflow_type, steps, schedule = "daily" }) {
        const results = await deepMcpAgent.run({
          context: { type: "workflow_automation", schema: {} },
          args: {},
          actions: [
            // Create workflow configuration
            {
              name: "mcp.callTool",
              arguments: {
                serverId: "filesystem",
                name: "write_file",
                arguments: {
                  path: `./workflows/${workflow_type}.yaml`,
                  content: `name: ${workflow_type}\nschedule: ${schedule}\nsteps: ${JSON.stringify(
                    steps
                  )}\nframework: AxiomKit`,
                },
              },
            },

            {
              name: "mcp.callTool",
              arguments: {
                serverId: "postgres",
                name: "execute_sql",
                arguments: {
                  sql: `INSERT INTO workflows (type, steps, schedule, created_at) VALUES ('${workflow_type}', '${JSON.stringify(
                    steps
                  )}', '${schedule}', NOW())`,
                },
              },
            },
          ],
        });

        return {
          message: `Workflow automation created: ${workflow_type}`,
          workflow_type,
          steps,
          schedule,
          results_count: results?.length || 0,
          framework: "AxiomKit",
          mcp_servers_used: ["filesystem", "postgres"],
        };
      },
    }),
  ],
  contexts: [
    {
      type: "research",
      schema: {},
      maxSteps: 15,
      onStep: async (state, agent) => {
        console.log(`🔍 Research step ${state.step} completed`);
      },
    },
    {
      type: "data_management",
      schema: {},
      maxSteps: 10,
      onStep: async (state, agent) => {
        console.log(`💾 Data management step ${state.step} completed`);
      },
    },
    {
      type: "code_development",
      schema: {},
      maxSteps: 12,
      onStep: async (state, agent) => {
        console.log(`💻 Code development step ${state.step} completed`);
      },
    },
    {
      type: "analytics",
      schema: {},
      maxSteps: 8,
      onStep: async (state, agent) => {
        console.log(`📊 Analytics step ${state.step} completed`);
      },
    },
    {
      type: "workflow_automation",
      schema: {},
      maxSteps: 10,
      onStep: async (state, agent) => {
        console.log(`🔄 Workflow automation step ${state.step} completed`);
      },
    },
  ],
});

export { deepMcpAgent };
