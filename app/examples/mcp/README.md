# SEI MCP Agent Example

This example demonstrates how to create a Model Context Protocol (MCP) server that integrates with the SEI blockchain using AxiomKit's SEI package.

## Features

The SEI MCP server provides the following tools:

- **get_balance**: Get SEI or ERC-20 token balance
- **transfer_tokens**: Transfer SEI or ERC-20 tokens
- **get_token_address**: Get token contract address from ticker symbol
- **get_wallet_info**: Get wallet address and SEI balance

## Setup

### 1. Install Dependencies

```bash
cd app/examples/mcp
pnpm install
```

### 2. Environment Variables

Set up your environment variables for SEI blockchain access:

```bash
export SEI_RPC_URL="YOUR_SEI_RPC_URL"
export SEI_PRIVATE_KEY="0x..." # Your private key (without 0x prefix)
```

### 3. Claude Desktop Configuration

Update your Claude Desktop config file (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "sei-blockchain-server": {
      "command": "npx",
      "args": [
        "-y",
        "tsx",
        "/app/examples/mcp/mcp-sei-server.ts"
      ],
      "env": {
        "SEI_RPC_URL": "YOUR_SEI_RPC_URL",
        "SEI_PRIVATE_KEY": "YOUR_PRIVATE_KEY_HERE"
      }
    }
  }
}
```

**Important**: Replace `YOUR_PRIVATE_KEY_HERE` with your actual SEI private key.

### 4. Running the Example

#### Option A: Using AxiomKit Agent
```bash
tsx mcp-sei.ts
```

#### Option B: Direct MCP Server
```bash
tsx mcp-sei-server.ts
```

## Usage Examples

Once configured, you can interact with the SEI blockchain through Claude:

### Get Wallet Information
```
Get my wallet information
```

### Check Balance
```
What's my SEI balance?
```

### Check Token Balance
```
What's my USDC balance?
```

### Transfer Tokens
```
Transfer 1.5 SEI to 0x1234567890123456789012345678901234567890
```

### Get Token Address
```
What's the contract address for USDC token?
```

## Security Notes

- **Never commit your private key** to version control
- Use environment variables for sensitive data
- Consider using a dedicated wallet for testing
- The private key should be in the format `0x...` (with 0x prefix)

## Architecture

The example consists of:

1. **mcp-sei-server.ts**: MCP server with SEI blockchain tools
2. **mcp-sei.ts**: AxiomKit agent that uses the MCP server
3. **package.json**: Dependencies including @axiomkit/sei

The server uses AxiomKit's SEI package which provides:
- Wallet management with viem
- ERC-20 token operations
- Token address lookup via DexScreener API
- Native SEI token handling

## Troubleshooting

### Common Issues

1. **"SEI wallet not initialized"**: Check your SEI_PRIVATE_KEY environment variable
2. **"Invalid recipient address"**: Ensure the address is a valid Ethereum address
3. **"Insufficient balance"**: Check your wallet balance before transfers
4. **"No token found"**: The token might not be available on SEI or the ticker is incorrect

### Debug Mode

To see detailed logs, the server outputs to stderr. Check the console where you started the server for debugging information.