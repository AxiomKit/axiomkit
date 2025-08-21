# AxiomKit Bot Examples

This directory contains comprehensive examples of AI agents built with AxiomKit, demonstrating the framework's capabilities for creating intelligent, autonomous systems.

## 🧮 Advanced Calculator Agent

A sophisticated calculator agent that demonstrates advanced mathematical capabilities, memory management, and user interaction.

### Features

- **🔢 Mathematical Operations**: Basic arithmetic, advanced functions (sin, cos, sqrt, etc.), and custom functions
- **💾 Variable Storage**: Save and reuse values across calculations
- **📊 Statistics Tracking**: Monitor calculation history and usage patterns
- **🎯 User Preferences**: Customize decimal places, notation, and display options
- **🧠 Memory System**: Remember conversations and calculation history
- **📝 Step-by-Step Explanations**: Detailed breakdowns of complex calculations
- **🔍 Expression Analysis**: Understand and optimize mathematical expressions

### Quick Start

1. **Install dependencies**:
   ```bash
   pnpm install
   ```

2. **Set up environment variables**:
   ```bash
   # Create .env file
   echo "GROQ_API_KEY=your_groq_api_key_here" > .env
   echo "NODE_ENV=development" >> .env
   ```

3. **Run the calculator**:
   ```bash
   npx tsx calculator.ts
   ```

4. **Test the logic** (without API key):
   ```bash
   npx tsx test-calculator.ts
   ```

### Usage Examples

#### Basic Calculations
```
> calculate 2 + 2
Result: 4

> calculate sqrt(16) + 5 * 3
Result: 19

> calculate sin(0) + cos(0)
Result: 1
```

#### Variable Management
```
> save variable x as 10
Variable 'x' saved with value 10

> calculate x^2 + 3*x + 1
Result: 131

> save variable pi as 3.14159
Variable 'pi' saved with value 3.14159

> calculate pi * 2
Result: 6.28
```

#### Advanced Features
```
> set my decimal places to 4
Your calculation preferences have been updated!

> show my calculation history
Recent calculations and statistics...

> analyze the expression sin(x) + cos(y)
Expression analysis with complexity assessment...

> define function f(x) = x^2 + 2*x + 1
Function 'f' has been defined successfully!
```

### Architecture

The calculator demonstrates several key AxiomKit concepts:

#### Context System
```typescript
const calculatorContext = context({
  type: "advanced-calculator",
  schema: z.object({
    userId: z.string(),
    sessionId: z.string().optional(),
  }),
  
  create: () => ({
    // Memory initialization
    calculationHistory: [],
    userPreferences: { decimalPlaces: 2 },
    statistics: { totalCalculations: 0 },
    savedVariables: new Map(),
  }),
  
  render: (state) => {
    // Context display logic
  },
  
  instructions: [
    // Agent personality and capabilities
  ],
});
```

#### Action Framework
```typescript
calculatorContext.setActions([
  action({
    name: "calculate",
    description: "Perform mathematical calculations",
    schema: z.object({
      expression: z.string(),
      showSteps: z.boolean().optional(),
      precision: z.number().optional(),
    }),
    handler: async (args, ctx) => {
      // Calculation logic with memory updates
    },
  }),
  
  action({
    name: "save-variable",
    description: "Store values in named variables",
    schema: z.object({
      name: z.string(),
      value: z.union([z.number(), z.string()]),
    }),
    handler: async (args, ctx) => {
      // Variable storage logic
    },
  }),
]);
```

#### Memory Management
The calculator maintains several types of memory:

- **Calculation History**: Track all performed calculations with metadata
- **User Preferences**: Store display and behavior preferences
- **Statistics**: Monitor usage patterns and performance metrics
- **Saved Variables**: Persistent storage for reusable values
- **Conversation Memory**: Remember recent interactions for context

### Testing

The `test-calculator.ts` file provides comprehensive testing of the calculator logic:

```bash
npx tsx test-calculator.ts
```

Tests cover:
- ✅ Basic arithmetic operations
- ✅ Advanced mathematical functions
- ✅ Variable substitution
- ✅ Error handling (division by zero, invalid syntax)
- ✅ Edge cases and boundary conditions

## 🌍 Advanced Translator Agent

A sophisticated translation agent with cultural context, memory, and multi-language support.

### Features

- **🌐 Multi-Language Support**: Translate between 100+ languages
- **🎭 Cultural Context**: Preserve cultural nuances and provide context notes
- **📚 Memory System**: Remember translation history and user preferences
- **🎨 Style Adaptation**: Formal, informal, and casual translation styles
- **🔊 Pronunciation Guides**: Phonetic pronunciation for non-Latin scripts
- **📖 Learning Capabilities**: Improve translations based on user feedback

### Quick Start

```bash
# Run the translator
npx tsx translator.ts

# Example usage
> translate hello to Spanish
> translate tôi nhớ bạn nhiều lắm to Chinese
> set my preferred languages to Spanish, French
> show my translation history
```

### Architecture Highlights

The translator demonstrates advanced AxiomKit patterns:

#### Complex Memory Structure
```typescript
create: () => ({
  translationHistory: [],
  userPreferences: {
    formalStyle: false,
    preserveFormatting: true,
    includePronunciation: false,
    culturalNotes: false,
  },
  languagePairs: new Map<string, number>(),
  translationStats: {
    totalTranslations: 0,
    languagesUsed: new Set<string>(),
    lastUsed: null,
  },
  recentConversations: [],
}),
```

#### Multiple Specialized Actions
- `translate`: Core translation with cultural context
- `set-preferences`: User preference management
- `get-history`: Translation history and statistics
- `suggest-languages`: AI-powered language recommendations
- `explain-translation`: Detailed translation analysis
- `remember-conversation`: Context preservation

## 🚀 Key Learning Points

### 1. Context Design
Both examples demonstrate effective context design:
- **Clear Schema**: Well-defined input parameters with validation
- **Rich Memory**: Comprehensive state management for user experience
- **Detailed Instructions**: Comprehensive agent personality and capabilities
- **Context Rendering**: Informative display of current state

### 2. Action Implementation
Best practices for action development:
- **Input Validation**: Zod schemas for type safety
- **Error Handling**: Graceful failure with helpful suggestions
- **Memory Updates**: Consistent state management
- **Rich Returns**: Detailed responses with metadata

### 3. Memory Management
Advanced memory patterns:
- **Structured Data**: Type-safe memory with clear organization
- **Statistics Tracking**: Usage analytics and insights
- **History Management**: Bounded collections with automatic cleanup
- **Preference Persistence**: User customization across sessions

### 4. User Experience
Design principles for agent interactions:
- **Progressive Disclosure**: Start simple, reveal advanced features
- **Context Awareness**: Remember and reference past interactions
- **Helpful Suggestions**: Proactive recommendations and optimizations
- **Error Recovery**: Clear guidance for fixing issues

## 🔧 Development Tips

### Testing Without API Keys
Use the test files to validate logic without requiring API access:
```bash
npx tsx test-calculator.ts
```

### Environment Setup
Always create proper environment files:
```bash
# .env
GROQ_API_KEY=your_actual_api_key
NODE_ENV=development
```

### Debugging
Enable detailed logging:
```typescript
const agent = createAgent({
  model: groq("deepseek-r1-distill-llama-70b"),
  extensions: [calculatorCliExtension],
  contexts: [calculatorContext],
  logLevel: 2, // Detailed logging
});
```

### Performance Optimization
- Use bounded collections (e.g., last 10 conversations)
- Implement lazy loading for large datasets
- Cache frequently accessed data
- Monitor memory usage patterns

## 📚 Next Steps

- **[First AI Agent Guide](../../../docs/content/docs/framework/getting-started/first-ai-agent)** - Learn the fundamentals
- **[Agent Architecture](../../../docs/content/docs/framework/architecture)** - Deep dive into agent design
- **[Action Framework](../../../docs/content/docs/framework/architecture/action)** - Master action development
- **[Memory Systems](../../../docs/content/docs/framework/architecture/memory)** - Advanced memory patterns
- **[Extensions](../../../docs/content/docs/extensions)** - Connect to external platforms

## 🤝 Contributing

These examples serve as templates for building your own agents. Feel free to:
- Extend the functionality with new actions
- Add more sophisticated memory patterns
- Implement additional user interface options
- Create new specialized agent types

The modular design makes it easy to adapt and extend these examples for your specific use cases.
