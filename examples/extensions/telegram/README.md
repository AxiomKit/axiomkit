# Telegram Order Bot Example

This example demonstrates how to create a Telegram bot that helps users place orders. The bot will ask for missing order details and confirm the order before processing.

## The Problem with the Original Code

The original `index.ts` has a fundamental issue: **the `orderContext` is never actually used by the agent**.

### Why the Original Code Doesn't Work

1. **Context Registration**: The `orderContext` is defined but never registered with the agent's context registry
2. **Message Routing**: Telegram messages are routed to the `telegramChat` context (from the telegram extension), not the `orderContext`
3. **Missing Primary Context**: The agent doesn't have a primary context to handle business logic

### What Happens in the Original Code

```typescript
// This creates the agent with orderContext in the contexts array
createAgent({
  contexts: [orderContext], // ❌ This doesn't make it the primary context
  extensions: [telegram],
}).start();
```

When a Telegram message arrives:
1. The telegram extension receives the message
2. It routes the message to the `telegramChat` context
3. The `orderContext` is never activated or used
4. The agent responds with generic behavior, not order-specific logic

## The Solution

### Option 1: Make orderContext the Primary Context (Recommended)

```typescript
// ✅ Make orderContext the primary context
createAgent({
  context: orderContext, // This makes it the main context
  extensions: [telegram],
}).start();
```

### Option 2: Integrate Order Logic into Telegram Context

Modify the telegram extension to include order functionality directly.

### Option 3: Use Context Composition

Use the `.use()` method to compose contexts together.

## Fixed Implementation

The `fixed-index.ts` file shows the correct implementation:

1. **Primary Context**: `orderContext` is set as the primary context
2. **Telegram Integration**: The context includes Telegram output handling
3. **State Management**: Order state is properly maintained in memory
4. **Instructions**: Clear instructions guide the AI's behavior

### Key Changes

```typescript
// ✅ Set as primary context
createAgent({
  context: orderContext, // Primary context
  actions: [confirmOrder],
  extensions: [telegram],
}).start();
```

```typescript
// ✅ Add Telegram output handling
outputs: {
  "telegram:message": {
    // ... telegram message handling
  },
}
```

## Testing the Fix

1. **Start the bot**: `node fixed-index.ts`
2. **Send a message**: "I want to place an order"
3. **Expected behavior**: The bot should ask for order details
4. **Verify state**: The bot should remember and track order information

## Understanding AxiomKit Context Architecture

In AxiomKit, there are typically two types of contexts:

1. **Primary Context**: Handles business logic (like order processing)
2. **Extension Contexts**: Handle communication (like Telegram, CLI)

The key insight is that **one context should be primary** and handle the core business logic, while extensions provide the communication layer.

## Common Patterns

### Pattern 1: Primary Context + Extensions
```typescript
createAgent({
  context: businessContext, // Primary context
  extensions: [telegram, cli], // Communication extensions
})
```

### Pattern 2: Context Composition
```typescript
const businessContext = context({
  // ... business logic
}).use((state) => [
  { context: telegramContext, args: { chatId: state.args.chatId } }
]);
```

### Pattern 3: Extension-Only
```typescript
// Define business logic in the extension itself
const telegramExtension = extension({
  contexts: {
    chat: context({
      // Include business logic here
    })
  }
});
```

## Best Practices

1. **One Primary Context**: Use one context for core business logic
2. **Clear Separation**: Keep communication and business logic separate
3. **State Management**: Use context memory for persistent state
4. **Instructions**: Provide clear, specific instructions to the AI
5. **Testing**: Test with various user inputs to ensure robustness

## Troubleshooting

### Issue: Context not being used
**Solution**: Make sure the context is set as the primary context or properly composed

### Issue: State not persisting
**Solution**: Use the `create` function to initialize memory and `memory.update()` to modify state

### Issue: Instructions not followed
**Solution**: Provide clear, specific instructions and test with various inputs

### Issue: Telegram messages not sending
**Solution**: Ensure the context has proper output handlers for Telegram 