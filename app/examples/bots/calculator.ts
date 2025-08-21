import { createAgent, context, action } from "@axiomkit/core";
import { createCliExtension } from "@axiomkit/cli";
import * as z from "zod";
import { groq } from "@ai-sdk/groq";

// Enhanced calculator context with memory and advanced features
const calculatorContext = context({
  type: "advanced-calculator",
  schema: z.object({
    userId: z.string().describe("Unique identifier for the user"),
    sessionId: z.string().optional().describe("Session identifier"),
  }),

  // Initialize memory for calculator with advanced features
  create: () => ({
    userName: "",
    calculationHistory: [] as Array<{
      expression: string;
      result: number;
      operation: string;
      timestamp: string;
      complexity: "simple" | "intermediate" | "advanced";
    }>,
    userPreferences: {
      decimalPlaces: 2,
      scientificNotation: false,
      showSteps: false,
      preferredOperations: [] as string[],
    },
    statistics: {
      totalCalculations: 0,
      operationsUsed: new Map<string, number>(),
      averageResult: 0,
      largestNumber: -Infinity,
      smallestNumber: Infinity,
    },
    savedVariables: new Map<string, number>(),
    customFunctions: new Map<string, string>(),
    sessionStartTime: new Date().toISOString(),
    conversationCount: 0,
    recentConversations: [] as Array<{
      userInput: string;
      botResponse: string;
      timestamp: string;
    }>,
  }),

  // Enhanced rendering with calculator context
  render: (state) => {
    const {
      userName,
      calculationHistory,
      statistics,
      userPreferences,
      conversationCount,
      recentConversations,
      savedVariables,
    } = state.memory;

    return `
🧮 Advanced Calculator Assistant
User: ${userName || "Guest"}
Session: ${state.args.sessionId || "default"}
Conversations: ${conversationCount}

📊 Calculation Statistics:
- Total calculations: ${statistics.totalCalculations}
- Average result: ${statistics.averageResult.toFixed(2)}
- Largest number: ${
      statistics.largestNumber === -Infinity ? "None" : statistics.largestNumber
    }
- Smallest number: ${
      statistics.smallestNumber === Infinity
        ? "None"
        : statistics.smallestNumber
    }

🎯 User Preferences:
- Decimal places: ${userPreferences.decimalPlaces}
- Scientific notation: ${userPreferences.scientificNotation ? "Yes" : "No"}
- Show calculation steps: ${userPreferences.showSteps ? "Yes" : "No"}
- Preferred operations: ${
      userPreferences.preferredOperations.join(", ") || "None set"
    }

💾 Saved Variables: ${
      Array.from(savedVariables.entries())
        .map(([name, value]) => `${name} = ${value}`)
        .join(", ") || "None"
    }

📝 Recent calculations (last 5):
${
  calculationHistory
    .slice(-5)
    .map((calc) => `${calc.expression} = ${calc.result} (${calc.operation})`)
    .join("\n") || "None"
}

🗣️ Recent conversations (last 5):
${
  recentConversations
    .slice(-5)
    .map(
      (conv) =>
        `User: "${conv.userInput.substring(
          0,
          30
        )}..." → Bot: "${conv.botResponse.substring(0, 30)}..."`
    )
    .join("\n") || "No conversations yet"
}
    `.trim();
  },

  // Comprehensive instructions for an impressive calculator
  instructions: [
    "You are a friendly and advanced AI calculator assistant with exceptional mathematical skills.",
    "Your capabilities include:",
    "- Basic arithmetic operations (+, -, *, /, ^)",
    "- Advanced mathematical functions (sin, cos, tan, log, sqrt, etc.)",
    "- Memory of calculation history and user preferences",
    "- Variable storage and retrieval",
    "- Custom function definitions",
    "- Statistical analysis and insights",
    "- Step-by-step calculation explanations",
    "- Learning from user feedback and corrections",
    "- Remembering the last 10 conversations for context",

    "Calculation Guidelines:",
    "- Always use the calculate action for mathematical operations",
    "- Respect user preferences for decimal places and notation",
    "- Provide step-by-step explanations when requested",
    "- Store results in variables when appropriate",
    "- Handle edge cases gracefully (division by zero, invalid expressions)",
    "- Use appropriate precision based on user preferences",

    "User Interaction:",
    "- Be warm, friendly, and mathematically precise",
    "- Remember user's calculation history and preferences",
    "- Reference previous calculations when relevant",
    "- Suggest optimizations or alternative approaches",
    "- Ask for clarification when expressions are ambiguous",
    "- Provide helpful explanations for complex calculations",
    "- Learn from user feedback to improve future responses",
    "- Keep track of the last 10 conversations for better context",

    "Available Actions:",
    "- calculate: Perform mathematical calculations with detailed results",
    "- set-preferences: Update user calculation preferences",
    "- save-variable: Store values in named variables",
    "- get-history: Show calculation history and statistics",
    "- define-function: Create custom mathematical functions",
    "- analyze-expression: Provide detailed analysis of mathematical expressions",
    "- clear-memory: Clear calculation history and variables",

    "Response Style:",
    "- Be precise, friendly, and mathematically accurate",
    "- Provide clear, well-formatted results",
    "- Include helpful context when relevant",
    "- Remember user preferences across sessions",
    "- Reference previous calculations when helpful",
    "- Always be encouraging and educational",
  ],

  // Track usage and update statistics
  onRun: async (ctx) => {
    ctx.memory.conversationCount++;
  },
});

// Advanced calculation action with multiple features
calculatorContext.setActions([
  action({
    name: "calculate",
    description: "Perform mathematical calculations with detailed results",
    schema: z.object({
      expression: z.string().describe("Mathematical expression to evaluate"),
      showSteps: z
        .boolean()
        .optional()
        .describe("Show step-by-step calculation"),
      precision: z
        .number()
        .optional()
        .describe("Number of decimal places for result"),
      saveAs: z.string().optional().describe("Save result as a variable name"),
    }),
    handler: async (args, ctx) => {
      const {
        expression,
        showSteps = ctx.memory.userPreferences.showSteps,
        precision = ctx.memory.userPreferences.decimalPlaces,
        saveAs,
      } = args;

      try {
        // Enhanced calculation with safety checks
        const result = await performAdvancedCalculation({
          expression,
          showSteps,
          precision,
          savedVariables: ctx.memory.savedVariables,
        });

        // Update statistics
        ctx.memory.statistics.totalCalculations++;
        ctx.memory.statistics.averageResult =
          (ctx.memory.statistics.averageResult *
            (ctx.memory.statistics.totalCalculations - 1) +
            result.value) /
          ctx.memory.statistics.totalCalculations;

        if (result.value > ctx.memory.statistics.largestNumber) {
          ctx.memory.statistics.largestNumber = result.value;
        }
        if (result.value < ctx.memory.statistics.smallestNumber) {
          ctx.memory.statistics.smallestNumber = result.value;
        }

        // Track operation usage
        const operation = result.operation;
        const currentCount =
          ctx.memory.statistics.operationsUsed.get(operation) || 0;
        ctx.memory.statistics.operationsUsed.set(operation, currentCount + 1);

        // Store in history
        ctx.memory.calculationHistory.push({
          expression,
          result: result.value,
          operation: result.operation,
          timestamp: new Date().toISOString(),
          complexity: result.complexity,
        });

        // Save as variable if requested
        if (saveAs) {
          ctx.memory.savedVariables.set(saveAs, result.value);
        }

        return {
          ...result,
          savedAs: saveAs || null,
          statistics: {
            totalCalculations: ctx.memory.statistics.totalCalculations,
            operationCount:
              ctx.memory.statistics.operationsUsed.get(operation) || 0,
          },
        };
      } catch (error) {
        return {
          error:
            error instanceof Error
              ? error.message
              : "Invalid mathematical expression",
          expression,
          suggestions: [
            "Check for balanced parentheses",
            "Ensure all operators are valid",
            "Verify variable names are defined",
            "Check for division by zero",
          ],
        };
      }
    },
  }),

  action({
    name: "set-preferences",
    description: "Update user calculation preferences",
    schema: z.object({
      decimalPlaces: z
        .number()
        .optional()
        .describe("Number of decimal places for results"),
      scientificNotation: z
        .boolean()
        .optional()
        .describe("Use scientific notation for large numbers"),
      showSteps: z
        .boolean()
        .optional()
        .describe("Show step-by-step calculations by default"),
      preferredOperations: z
        .array(z.string())
        .optional()
        .describe("User's preferred mathematical operations"),
    }),
    handler: async (args, ctx) => {
      Object.assign(ctx.memory.userPreferences, args);

      return {
        updated: true,
        preferences: ctx.memory.userPreferences,
        message: "Your calculation preferences have been updated!",
      };
    },
  }),

  action({
    name: "save-variable",
    description: "Store a value in a named variable for later use",
    schema: z.object({
      name: z.string().describe("Variable name"),
      value: z
        .union([z.number(), z.string()])
        .describe("Value to store (number or expression)"),
    }),
    handler: async (args, ctx) => {
      const { name, value } = args;

      let numericValue: number;
      if (typeof value === "string") {
        // Evaluate the expression
        const result = await performAdvancedCalculation({
          expression: value,
          showSteps: false,
          precision: ctx.memory.userPreferences.decimalPlaces,
          savedVariables: ctx.memory.savedVariables,
        });
        numericValue = result.value;
      } else {
        numericValue = value;
      }

      ctx.memory.savedVariables.set(name, numericValue);

      return {
        saved: true,
        variable: name,
        value: numericValue,
        message: `Variable '${name}' saved with value ${numericValue}`,
      };
    },
  }),

  action({
    name: "get-history",
    description: "Get calculation history and statistics",
    schema: z.object({
      limit: z
        .number()
        .optional()
        .describe("Number of recent calculations to show"),
      operation: z.string().optional().describe("Filter by specific operation"),
    }),
    handler: async (args, ctx) => {
      const { limit = 10, operation } = args;
      let history = ctx.memory.calculationHistory;

      if (operation) {
        history = history.filter((calc) => calc.operation === operation);
      }

      return {
        history: history.slice(-limit),
        statistics: ctx.memory.statistics,
        savedVariables: Object.fromEntries(ctx.memory.savedVariables),
        mostUsedOperations: Array.from(
          ctx.memory.statistics.operationsUsed.entries()
        )
          .sort(([, a], [, b]) => b - a)
          .slice(0, 5)
          .map(([op, count]) => ({ operation: op, count })),
      };
    },
  }),

  action({
    name: "define-function",
    description: "Create custom mathematical functions",
    schema: z.object({
      name: z.string().describe("Function name"),
      expression: z
        .string()
        .describe("Function expression (use x as variable)"),
      description: z
        .string()
        .optional()
        .describe("Description of what the function does"),
    }),
    handler: async (args, ctx) => {
      const { name, expression, description } = args;

      ctx.memory.customFunctions.set(name, expression);

      return {
        defined: true,
        function: name,
        expression,
        description:
          description || `Custom function ${name}(x) = ${expression}`,
        message: `Function '${name}' has been defined successfully!`,
      };
    },
  }),

  action({
    name: "analyze-expression",
    description: "Provide detailed analysis of a mathematical expression",
    schema: z.object({
      expression: z.string().describe("Expression to analyze"),
    }),
    handler: async (args, ctx) => {
      const analysis = await analyzeMathematicalExpression(
        args.expression,
        ctx.memory
      );
      return analysis;
    },
  }),

  action({
    name: "clear-memory",
    description: "Clear calculation history and saved variables",
    schema: z.object({
      clearHistory: z
        .boolean()
        .optional()
        .describe("Clear calculation history"),
      clearVariables: z.boolean().optional().describe("Clear saved variables"),
      clearAll: z.boolean().optional().describe("Clear everything"),
    }),
    handler: async (args, ctx) => {
      const { clearHistory, clearVariables, clearAll } = args;

      if (clearAll || clearHistory) {
        ctx.memory.calculationHistory = [];
        ctx.memory.statistics = {
          totalCalculations: 0,
          operationsUsed: new Map(),
          averageResult: 0,
          largestNumber: -Infinity,
          smallestNumber: Infinity,
        };
      }

      if (clearAll || clearVariables) {
        ctx.memory.savedVariables.clear();
      }

      return {
        cleared: true,
        message: "Memory cleared successfully!",
        remainingCalculations: ctx.memory.calculationHistory.length,
        remainingVariables: ctx.memory.savedVariables.size,
      };
    },
  }),

  action({
    name: "remember-conversation",
    description: "Remember the current conversation for context",
    schema: z.object({
      userInput: z.string().describe("What the user said"),
      botResponse: z.string().describe("What the bot responded"),
    }),
    handler: async (args, ctx) => {
      const { userInput, botResponse } = args;

      // Add to recent conversations (keep only last 10)
      ctx.memory.recentConversations.push({
        userInput,
        botResponse,
        timestamp: new Date().toISOString(),
      });

      // Keep only the last 10 conversations
      if (ctx.memory.recentConversations.length > 10) {
        ctx.memory.recentConversations =
          ctx.memory.recentConversations.slice(-10);
      }

      return {
        remembered: true,
        conversationCount: ctx.memory.recentConversations.length,
        message: "I've remembered this conversation for future context!",
      };
    },
  }),
]);

// Helper function for advanced calculation simulation
async function performAdvancedCalculation({
  expression,
  showSteps,
  precision,
  savedVariables,
}: {
  expression: string;
  showSteps: boolean;
  precision: number;
  savedVariables: Map<string, number>;
}) {
  // Enhanced calculation with variable substitution
  let processedExpression = expression;

  // Replace variables with their values
  for (const [name, value] of savedVariables.entries()) {
    const regex = new RegExp(`\\b${name}\\b`, "g");
    processedExpression = processedExpression.replace(regex, value.toString());
  }

  // Replace ^ with ** for JavaScript exponentiation
  processedExpression = processedExpression.replace(/\^/g, "**");

  // Mathematical functions
  const functions: Record<string, (x: number) => number> = {
    sin: Math.sin,
    cos: Math.cos,
    tan: Math.tan,
    log: Math.log10,
    ln: Math.log,
    sqrt: Math.sqrt,
    abs: Math.abs,
    floor: Math.floor,
    ceil: Math.ceil,
    round: Math.round,
  };

  // Create a safe evaluation context with mathematical functions
  const evalContext = {
    ...functions,
    Math: Math,
    PI: Math.PI,
    E: Math.E,
  };

  let result: number;
  let operation = "evaluation";
  let complexity: "simple" | "intermediate" | "advanced" = "simple";
  let steps: string[] = [];

  try {
    // Check for functions
    for (const [funcName] of Object.entries(functions)) {
      const regex = new RegExp(`${funcName}\\(([^)]+)\\)`, "g");
      if (regex.test(processedExpression)) {
        complexity = "intermediate";
        operation = funcName;
        if (showSteps) {
          steps.push(`Applying ${funcName} function`);
        }
      }
    }

    // Check for advanced operations
    if (processedExpression.includes("**")) {
      complexity = "intermediate";
      operation = "exponentiation";
    }

    // Safe evaluation with mathematical functions available
    const evalFunction = new Function(
      ...Object.keys(evalContext),
      `return ${processedExpression}`
    );
    result = evalFunction(...Object.values(evalContext));

    // Check for division by zero and other edge cases
    if (!isFinite(result)) {
      if (result === Infinity || result === -Infinity) {
        throw new Error("Result is infinite (possible division by zero)");
      }
      throw new Error("Result is not a valid number");
    }

    if (showSteps) {
      steps.push(`Evaluated: ${processedExpression} = ${result}`);
    }

    // Apply precision
    result = Number(result.toFixed(precision));

    return {
      value: result,
      operation,
      complexity,
      steps: showSteps ? steps : undefined,
      expression: processedExpression,
      precision,
    };
  } catch (error) {
    throw new Error(
      `Calculation error: ${
        error instanceof Error ? error.message : "Invalid expression"
      }`
    );
  }
}

// Helper function to analyze mathematical expressions
async function analyzeMathematicalExpression(expression: string, memory: any) {
  const analysis = {
    expression,
    complexity: "simple" as "simple" | "intermediate" | "advanced",
    operations: [] as string[],
    variables: [] as string[],
    functions: [] as string[],
    suggestions: [] as string[],
  };

  // Analyze operations
  const operationPatterns = {
    "+": "addition",
    "-": "subtraction",
    "*": "multiplication",
    "/": "division",
    "^": "exponentiation",
  };

  for (const [symbol, name] of Object.entries(operationPatterns)) {
    if (expression.includes(symbol)) {
      analysis.operations.push(name);
    }
  }

  // Analyze functions
  const functionNames = [
    "sin",
    "cos",
    "tan",
    "log",
    "ln",
    "sqrt",
    "abs",
    "floor",
    "ceil",
    "round",
  ];
  for (const func of functionNames) {
    if (expression.includes(func)) {
      analysis.functions.push(func);
    }
  }

  // Analyze variables
  const variableRegex = /\b[a-zA-Z_][a-zA-Z0-9_]*\b/g;
  const matches = expression.match(variableRegex) || [];
  analysis.variables = matches.filter(
    (match) =>
      !functionNames.includes(match) &&
      ![
        "sin",
        "cos",
        "tan",
        "log",
        "ln",
        "sqrt",
        "abs",
        "floor",
        "ceil",
        "round",
      ].includes(match)
  );

  // Determine complexity
  if (
    analysis.functions.length > 0 ||
    analysis.operations.includes("exponentiation")
  ) {
    analysis.complexity = "intermediate";
  }
  if (analysis.functions.length > 2 || analysis.variables.length > 3) {
    analysis.complexity = "advanced";
  }

  // Generate suggestions
  if (analysis.variables.length > 0) {
    analysis.suggestions.push("Consider defining variables before calculation");
  }
  if (analysis.complexity === "advanced") {
    analysis.suggestions.push(
      "Break down complex expressions into smaller parts"
    );
  }
  if (analysis.operations.includes("division")) {
    analysis.suggestions.push("Check for potential division by zero");
  }

  return analysis;
}

// Create enhanced CLI extension for the calculator
const calculatorCliExtension = createCliExtension({
  name: "advanced-calculator",
  instructions: [
    "You are a friendly and advanced AI calculator with exceptional mathematical skills.",
    "Use the available actions to perform calculations and provide insights.",
    "Remember user preferences and calculation history.",
    "Keep track of the last 10 conversations for better context.",
    "Provide step-by-step explanations when helpful.",
    "Be precise, friendly, and mathematically accurate.",
    "Always use the calculate action for mathematical operations.",
    "Use remember-conversation action to store conversation context.",
  ],
  maxSteps: 10, // Allow more steps for complex calculations
});

// Create the agent with enhanced configuration
const agent = createAgent({
  model: groq("deepseek-r1-distill-llama-70b"),
  extensions: [calculatorCliExtension],
  contexts: [calculatorContext],
  logLevel: 2,
});

async function main() {
  await agent.start();

  console.log("\n🧮 Advanced Calculator Assistant Started!");
  console.log("✨ Features:");
  console.log("  • Basic and advanced mathematical operations");
  console.log("  • Variable storage and custom functions");
  console.log("  • Calculation history and statistics");
  console.log("  • Step-by-step explanations");
  console.log("  • Memory of your preferences and calculations");
  console.log("  • Remembers last 10 conversations for context");
  console.log("  • Mathematical expression analysis");
  console.log("\n💡 Try these commands:");
  console.log("  • 'calculate 2 + 2'");
  console.log("  • 'calculate sqrt(16) + 5 * 3'");
  console.log("  • 'save variable x as 10'");
  console.log("  • 'calculate x^2 + 3*x + 1'");
  console.log("  • 'set my decimal places to 4'");
  console.log("  • 'show my calculation history'");
  console.log("  • 'analyze the expression sin(x) + cos(y)'");
  console.log("  • 'define function f(x) = x^2 + 2*x + 1'");
  console.log("\n🚀 Type 'exit' to quit.\n");

  const userId = process.argv[2] || "default-user";
  const sessionId = `session-${Date.now()}`;

  console.log(`Starting session for user: ${userId} (${sessionId})\n`);

  await agent.run({
    context: calculatorContext,
    args: { userId, sessionId },
  });

  console.log("\n👋 Thank you for using Advanced Calculator Assistant!");
}

main().catch(console.error);
