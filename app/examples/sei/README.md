# SEI Basic Query Example

This is a simple example of an Axiom agent that can check SEI wallet balances by passing a query as a command line argument.

## Features

- Direct query execution via command line arguments
- Get SEI wallet balance
- Simple and focused on basic functionality

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
export SEI_PRIVATE_KEY=0xYourPrivateKeyHere
export SEI_RPC_URL=https://rpc-testnet.sei-apis.com
export GROQ_API_KEY=your_groq_api_key_here
```

3. Run the example:
```bash
# With default query
npx tsx basic-query.ts

# With custom query
npx tsx basic-query.ts "What is my balance?"
npx tsx basic-query.ts "Check my SEI balance"
npx tsx basic-query.ts "How much SEI do I have?"
```

## Usage

The agent will:
1. Start up and connect to the SEI network
2. Execute your query
3. Call the `getBalance` action if needed
4. Display the response
5. Stop automatically

Example queries:
- "What is my balance?"
- "Check my SEI balance"
- "How much SEI do I have?"

## Code Structure

- `basic-query.ts` - Main example file with the agent configuration
- The agent uses the Axiom framework with a SEI context
- Includes a single `getBalance` action for checking wallet balances
- Uses Groq's Llama model for natural language processing

## Environment Variables

- `SEI_PRIVATE_KEY`: Your SEI wallet private key (starts with 0x)
- `SEI_RPC_URL`: SEI RPC endpoint URL (testnet or mainnet)
