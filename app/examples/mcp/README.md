# Claude Desktop Setup for AxiomKit MCP

This guide will help you configure Claude Desktop to use your AxiomKit MCP servers.

## 🚀 Quick Setup

### Step 1: Find Claude Desktop Config File

**On macOS:**
```bash
# Open the config file
open ~/Library/Application Support/Claude/claude_desktop_config.json
```

**On Windows:**
```bash
# Navigate to the config file
%APPDATA%\Claude\claude_desktop_config.json
```

**On Linux:**
```bash
# Navigate to the config file
~/.config/claude/claude_desktop_config.json
```

### Step 2: Add MCP Server Configuration

Add this configuration to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "axiomkit-simple-test": {
      "command": "npx",
      "args": [
        "-y",
        "tsx",
        "~config_folder_url/mcp-simple-server.ts"
      ],
      "env": {}
    },
    "axiomkit-sei-server": {
      "command": "npx",
      "args": [
        "-y",
        "tsx",
        "~config_folder_url/mcp-sei-server-axiomkit.ts"
      ],
      "env": {
        "SEI_PRIVATE_KEY": "Your_SEI_PRIVATE_KEY_EXAMPLE",
        "SEI_RPC_URL": "YOUR_SEI_RPC_URL_EXAMPLE"
      }
    }
  }
}
```

### Step 3: Update Paths

Make sure to update the paths in the config to match your system:

**For your system, the paths should be:**
```json
{
  "mcpServers": {
    "axiomkit-simple-test": {
      "command": "tsx",
      "args": ["/Users/karas/Desktop/Dev Karas/axiomkit/app/examples/mcp/mcp-simple-server.ts"],
      "env": {}
    }
  }
}
```

### Step 4: Restart Claude Desktop

1. Close Claude Desktop completely
2. Reopen Claude Desktop
3. You should see the MCP servers connected

## 🧪 Testing the Setup

### Test 1: Simple MCP Server (No Environment Variables)
1. Make sure `axiomkit-simple-test` is configured
2. Open Claude Desktop
3. Ask Claude: "Use the get_info tool to get server information"
4. Ask Claude: "Test the echo tool with message 'Hello from Claude'"
5. Ask Claude: "Use the add tool to calculate 15 + 25"

### Test 2: SEI MCP Server (Requires Environment Variables)
1. Set your environment variables in the config
2. Make sure `axiomkit-sei-server` is configured
3. Open Claude Desktop
4. Ask Claude: "Get my wallet information"
5. Ask Claude: "Check my SEI balance"

## 🔧 Troubleshooting

### Common Issues

1. **"Command not found" errors**
   - Make sure `tsx` is installed globally: `npm install -g tsx`
   - Or use `npx tsx` instead of `tsx`

2. **Path not found errors**
   - Update the paths in the config to match your system
   - Make sure the files exist at those paths

3. **Environment variable errors**
   - For simple testing, use `axiomkit-simple-test` (no env vars needed)
   - For SEI functionality, set the environment variables in the config

4. **Claude Desktop not connecting**
   - Restart Claude Desktop after changing the config
   - Check the Claude Desktop logs for errors

### Alternative: Using npx

If `tsx` is not installed globally, you can use `npx`:

```json
{
  "mcpServers": {
    "axiomkit-simple-test": {
      "command": "npx",
      "args": ["tsx", "/Users/karas/Desktop/Dev Karas/axiomkit/app/examples/mcp/mcp-simple-server.ts"],
      "env": {}
    }
  }
}
```

## 📝 Example Configurations

### Minimal Setup (Simple Test)
```json
{
  "mcpServers": {
    "axiomkit-simple-test": {
      "command": "tsx",
      "args": ["/Users/karas/Desktop/Dev Karas/axiomkit/app/examples/mcp/mcp-simple-server.ts"],
      "env": {}
    }
  }
}
```

### Full Setup (With SEI)
```json
{
  "mcpServers": {
    "axiomkit-simple-test": {
      "command": "tsx",
      "args": ["/Users/karas/Desktop/Dev Karas/axiomkit/app/examples/mcp/mcp-simple-server.ts"],
      "env": {}
    },
    "axiomkit-sei-server": {
      "command": "tsx", 
      "args": ["/Users/karas/Desktop/Dev Karas/axiomkit/app/examples/mcp/mcp-sei-server-axiomkit.ts"],
      "env": {
        "SEI_PRIVATE_KEY": "your-private-key-here",
        "SEI_RPC_URL": "your-rpc-url-here"
      }
    }
  }
}
```

## 🎯 What You Can Test

Once configured, you can ask Claude to:

1. **Basic MCP Tools:**
   - "Use the get_info tool to get server information"
   - "Test the echo tool with message 'Hello from Claude'"
   - "Use the add tool to calculate 15 + 25"

2. **SEI Blockchain (if configured):**
   - "Get my wallet information"
   - "Check my SEI balance"
   - "Get token address for USDC"

3. **MCP Connection Management:**
   - "List all MCP servers"
   - "Get connection status"
   - "Test MCP tool calls"

## 🚀 Quick Start

1. **Copy the config** from `claude-desktop-config.json`
2. **Update the paths** to match your system
3. **Add to Claude Desktop config** file
4. **Restart Claude Desktop**
5. **Start testing** with Claude!

The key difference from the previous approach is that now Claude Desktop will automatically start and manage the MCP servers, so you don't need to run `npm run test-claude` manually.

