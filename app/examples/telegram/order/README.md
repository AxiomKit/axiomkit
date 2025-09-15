# Telegram Order Bot Example

This example demonstrates how to create a Telegram bot that helps users place orders. The bot will ask for missing order details and confirm the order before processing.

## Features

- **Natural Conversation Flow**: Handles "create order about product" requests naturally
- **Progressive Information Gathering**: Asks for one detail at a time to avoid overwhelming users
- **Order Confirmation**: Provides clear order summaries and confirmation before processing
- **State Management**: Maintains order state throughout the conversation
- **Friendly Responses**: Uses conversational, helpful language instead of JSON responses

## How It Works

### 1. Order Request Handling
When a user says "create order about product" or similar:
- The bot asks what specific product they want to order
- Maintains a friendly, conversational tone

### 2. Information Collection
The bot progressively collects:
- **Product**: What the user wants to order
- **Quantity**: How many they want
- **Customer Name**: For the order
- **Delivery Address**: Where to ship

### 3. Order Confirmation
When all details are provided:
- The bot summarizes the complete order
- Asks for confirmation before processing
- Uses the `confirmOrder` action to finalize

### 4. Response Format
- **Natural Language**: All responses are in plain text, never JSON
- **Conversational**: Friendly and helpful tone
- **Concise**: Clear information without overwhelming the user

## Example Conversation Flow

```
User: "let create order about product"
Bot: "Sure! What product would you like to order?"

User: "I want a laptop"
Bot: "Great! How many laptops would you like to order?"

User: "1"
Bot: "Perfect! What's your name for the order?"

User: "John Smith"
Bot: "Thanks John! What's your delivery address?"

User: "123 Main St, City, State 12345"
Bot: "Perfect! Here's your order summary:
      - Product: Laptop
      - Quantity: 1
      - Customer: John Smith
      - Address: 123 Main St, City, State 12345
      
      Should I confirm this order for you?"

User: "Yes"
Bot: "✅ Order confirmed! Here's your order summary:
      [Order details]
      
      Your order has been processed and will be shipped soon."
```

## Key Improvements

### 1. Better Instructions
The context now has detailed instructions for handling different types of requests:
- Specific handling for "create order about product" requests
- Progressive information gathering
- Clear response guidelines

### 2. Enhanced Order Action
The `confirmOrder` action now:
- Accepts an optional order summary
- Provides detailed confirmation messages
- Handles both confirmation and cancellation gracefully

### 3. Improved State Management
- Added `orderSummary` to track the complete order details
- Better memory management for order state
- Clear state tracking for debugging

### 4. Natural Response Format
- No more JSON responses
- Conversational, friendly language
- Clear, structured information presentation

## Technical Implementation

### Context Structure
```typescript
const orderContext = context({
  type: "order-context",
  schema: z.object({
    customerName: z.string().optional(),
    product: z.string().optional(),
    quantity: z.number().optional(),
    address: z.string().optional(),
    confirmed: z.boolean().default(false),
    orderSummary: z.string().optional(),
    chatId: z.number().optional(),
  }),
  // ... instructions and outputs
});
```

### Action Definition
```typescript
const confirmOrder = action({
  name: "confirmOrder",
  description: "Mark the order as confirmed and process it",
  schema: z.object({
    confirmed: z.boolean(),
    orderSummary: z.string().optional(),
  }),
  handler: async ({ confirmed, orderSummary }: { confirmed: boolean; orderSummary?: string }, ctx: any) => {
    // ... order processing logic
  },
});
```

## Testing the Bot

1. **Start the bot**: `node index.ts`
2. **Test order creation**: Send "let create order about product"
3. **Follow the flow**: Provide product, quantity, name, and address
4. **Confirm order**: Say "yes" to confirm the order
5. **Verify response**: Check that you get a proper confirmation message

## Best Practices Demonstrated

1. **Progressive Disclosure**: Ask for one piece of information at a time
2. **State Persistence**: Maintain order state throughout the conversation
3. **Clear Instructions**: Provide detailed guidance for the AI
4. **Natural Language**: Use conversational responses instead of JSON
5. **Error Handling**: Graceful handling of cancellations and confirmations
6. **User Experience**: Friendly, helpful tone throughout the interaction

## Troubleshooting

### Issue: Bot responds with JSON
**Solution**: Make sure the instructions emphasize responding in plain text, not JSON

### Issue: Order state not persisting
**Solution**: Verify that `memory.update()` is being called correctly in the action handler

### Issue: Bot doesn't ask for all required information
**Solution**: Check that the instructions include all the required order fields

### Issue: Confirmation not working
**Solution**: Ensure the `confirmOrder` action is properly defined and called

## Next Steps

To extend this example, you could:
1. Add product catalog integration
2. Implement payment processing
3. Add order tracking functionality
4. Integrate with inventory management
5. Add multi-language support 