import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import * as z from "zod";
import { setupMcpServerEnvironment } from "./server-utils";

export interface McpServerOptions {
  name: string;
  version: string;
}

export interface ToolSchema {
  [key: string]: z.ZodTypeAny | {
    type: "string" | "number" | "boolean" | "array" | "object";
    description?: string;
    [key: string]: any;
  };
}

export interface ToolHandler<T extends ToolSchema = ToolSchema> {
  (args: {
    [K in keyof T]: T[K] extends z.ZodTypeAny
      ? z.infer<T[K]>
      : T[K] extends { type: "string" }
      ? string
      : T[K] extends { type: "number" }
      ? number
      : T[K] extends { type: "boolean" }
      ? boolean
      : T[K] extends { type: "array" }
      ? any[]
      : T[K] extends { type: "object" }
      ? Record<string, any>
      : any;
  }): Promise<{
    content: Array<
      | { type: "text"; text: string }
      | { type: "image"; data: string; mimeType: string }
      | { type: "resource"; resource: { uri: string; text: string; mimeType?: string } }
      | { type: "resource"; resource: { uri: string; blob: string; mimeType?: string } }
    >;
  }>;
}

/**
 * Adds _parse polyfill to Zod v4 schemas for MCP SDK compatibility.
 * The MCP SDK expects Zod v3's _parse method, but Zod v4 doesn't expose it.
 * This polyfill adds _parse that matches the Zod v3 signature expected by MCP SDK.
 * 
 * Zod v3's _parse signature:
 * _parse(input: { data: unknown; path: (string | number)[]; parent?: any }): { status: 'valid' | 'invalid'; value?: unknown; error?: ZodError }
 */
function addParsePolyfill(zodSchema: z.ZodTypeAny): z.ZodTypeAny {
  // Check if _parse already exists (Zod v3) or if we need to add it (Zod v4)
  if (typeof (zodSchema as any)._parse === 'function') {
    return zodSchema;
  }

  // For Zod v4, add _parse polyfill that matches Zod v3's signature
  // The MCP SDK calls _parse with a ParseInput object: { data, path, parent }
  const schemaWithParse = zodSchema as any;
  
  // Add _parse method that matches Zod v3's signature
  if (!schemaWithParse._parse) {
    schemaWithParse._parse = function(input: { data?: unknown; path?: (string | number)[]; parent?: any } | unknown) {
      // Handle both Zod v3 format (object with data/path/parent) and direct value
      const data = input && typeof input === 'object' && 'data' in input 
        ? (input as any).data 
        : input;
      
      // Use safeParse to validate
      const result = this.safeParse(data);
      
      if (result.success) {
        return {
          status: 'valid' as const,
          value: result.data,
        };
      } else {
        // Convert ZodError to the format expected by MCP SDK
        return {
          status: 'invalid' as const,
          error: result.error,
        };
      }
    };
  }
  
  return schemaWithParse as z.ZodTypeAny;
}

/**
 * Converts a ZodRawShape to JSON Schema format using Zod v4's native z.toJSONSchema().
 * This is much more reliable than manually parsing the schema structure.
 */
function zodRawShapeToJsonSchema(zodShape: z.ZodRawShape): any {
  // Wrap the ZodRawShape in z.object() to create a ZodObject
  const zodObject = z.object(zodShape);
  
  // Use Zod v4's native JSON Schema conversion
  // Target draft-7 for compatibility with MCP SDK
  return z.toJSONSchema(zodObject, {
    target: "draft-7",
  });
}

/**
 * Converts a tool schema to ZodRawShape format expected by McpServer.tool()
 */
function schemaToZodRawShape(schema: ToolSchema): z.ZodRawShape {
  // Handle empty schema - return empty object
  if (Object.keys(schema).length === 0) {
    return {};
  }

  const zodShape: Record<string, z.ZodTypeAny> = {};

  for (const [key, value] of Object.entries(schema)) {
    if (value && typeof value === "object" && "_def" in value) {
      // Already a Zod schema - add _parse polyfill if needed
      zodShape[key] = addParsePolyfill(value as z.ZodTypeAny);
    } else if (value && typeof value === "object" && "type" in value) {
      // Plain object schema - convert to Zod
      const plainSchema = value as { type: string; description?: string; optional?: boolean };
      let zodType: z.ZodTypeAny;
      
      // Create base Zod type - build it step by step to ensure validity
      let baseType: z.ZodTypeAny;
      switch (plainSchema.type) {
        case "string":
          baseType = z.string();
          break;
        case "number":
          baseType = z.number();
          break;
        case "boolean":
          baseType = z.boolean();
          break;
        case "array":
          baseType = z.array(z.any());
          break;
        case "object":
          baseType = z.object({});
          break;
        default:
          baseType = z.string();
      }
      
      // Build the final type: base -> optional (if needed) -> describe (if needed)
      // We need to use .describe() to preserve the description in the schema
      zodType = baseType;
      
      if (plainSchema.optional) {
        zodType = zodType.optional();
      }
      
      // Apply description using .describe() - this is safe and needed for MCP SDK
      // The description is used by the MCP SDK to generate the inputSchema
      if (plainSchema.description) {
        zodType = zodType.describe(plainSchema.description);
      }
      
      // Add _parse polyfill for MCP SDK compatibility
      zodShape[key] = addParsePolyfill(zodType);
    } else {
      // Fallback to optional string
      zodShape[key] = addParsePolyfill(z.string().optional());
    }
  }

  return zodShape as z.ZodRawShape;
}

/**
 * Creates a new MCP server instance with the given options.
 * Automatically sets up the environment (fetch polyfills, console redirection).
 */
export function createMcpServer(options: McpServerOptions) {
  // Setup environment for MCP server
  setupMcpServerEnvironment();

  const server = new McpServer({
    name: options.name,
    version: options.version,
  });

  // Store manually created JSON schemas for tools
  const toolJsonSchemas = new Map<string, any>();

  return {
    /**
     * Register a tool on the MCP server.
     * 
     * @param name - The name of the tool
     * @param schema - The schema for the tool arguments (Zod schema or plain object)
     * @param handler - The handler function that executes the tool
     */
    tool<T extends ToolSchema>(
      name: string,
      schema: T,
      handler: ToolHandler<T>
    ) {
      // Convert schema to ZodRawShape
      const zodShape = schemaToZodRawShape(schema);
      
      // Debug: Log the schema conversion to help diagnose issues
      console.error(`[MCP Debug] Registering tool "${name}"`);
      console.error(`[MCP Debug] Original schema keys:`, Object.keys(schema));
      console.error(`[MCP Debug] Converted ZodShape keys:`, Object.keys(zodShape));
      if (Object.keys(zodShape).length > 0) {
        console.error(`[MCP Debug] First schema value type:`, typeof zodShape[Object.keys(zodShape)[0]], 'has _def:', !!(zodShape[Object.keys(zodShape)[0]] as any)?._def);
      }
      
      // Register the tool with the MCP server
      // Use different overloads based on whether schema is empty
      if (Object.keys(zodShape).length === 0) {
        // Empty schema - use the no-parameter overload
        server.tool(name, async () => {
          const result = await handler({} as any);
          return result as any;
        });
      } else {
        // Has schema - use the schema overload
        // The MCP SDK expects (args, extra) signature
        // Pass zodShape directly - it's already a proper ZodRawShape
        // The MCP SDK will handle the schema processing internally
        
        // Debug: Verify the schema structure before passing to MCP SDK
        console.error(`[MCP Debug] Clean ZodShape for "${name}":`, Object.keys(zodShape));
        for (const [key, schema] of Object.entries(zodShape)) {
          const zodSchema = schema as any;
          // Check for _parse (required by MCP SDK)
          const hasParse = typeof zodSchema._parse === 'function';
          console.error(`[MCP Debug]   ${key}: type=${typeof zodSchema}, has _def=${!!zodSchema._def}, has _parse=${hasParse}, constructor=${zodSchema.constructor?.name}`);
        }
        
        // Create JSON schema using Zod v4's native z.toJSONSchema()
        // This is needed because the MCP SDK's zod-to-json-schema v3.24.1 doesn't support Zod v4
        const jsonSchema = zodRawShapeToJsonSchema(zodShape);
        toolJsonSchemas.set(name, jsonSchema);
        console.error(`[MCP Debug] JSON Schema for "${name}" (using z.toJSONSchema()):`, JSON.stringify(jsonSchema, null, 2));
        
        // Pass the zodShape directly to the MCP SDK
        // The MCP SDK expects a ZodRawShape which is { [key: string]: ZodTypeAny }
        // The MCP SDK will wrap it in z.object() internally for validation
        // We'll override the tools/list handler to use our manually created JSON schema
        server.tool(name, zodShape as z.ZodRawShape, async (args: any, extra?: any) => {
          const result = await handler(args);
          return result as any;
        });
      }
      
      return this;
    },

    /**
     * Connect the server to a stdio transport.
     * This is the standard way to run MCP servers.
     */
    async connect() {
      // Override tools/list handler to inject JSON schemas created with Zod v4's z.toJSONSchema()
      // This is needed because the MCP SDK's zod-to-json-schema v3.24.1 doesn't support Zod v4
      if (server.server) {
        server.server.setRequestHandler(ListToolsRequestSchema, async () => {
        // Get tools from the MCP SDK's internal registry
        const registeredTools = (server as any)._registeredTools || {};
        const tools = Object.entries(registeredTools)
          .filter(([, tool]: [string, any]) => tool.enabled)
          .map(([name, tool]: [string, any]) => {
            // Use our JSON schema created with z.toJSONSchema() if available
            // Otherwise fall back to empty schema
            const customJsonSchema = toolJsonSchemas.get(name);
            const inputSchema = customJsonSchema || { type: "object", properties: {} };
            
            return {
              name,
              title: tool.title,
              description: tool.description,
              inputSchema,
              annotations: tool.annotations,
            };
          });
        
        return { tools };
        });
      }
      
      const transport = new StdioServerTransport();
      await server.connect(transport);
      console.error(`${options.name} running on stdio`);
    },

    /**
     * Get the underlying MCP server instance for advanced usage.
     */
    getServer() {
      return server;
    },
  };
}

