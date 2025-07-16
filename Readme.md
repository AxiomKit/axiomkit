## Overview

**AxiomKit** is a lightweight TypeScript framework for building autonomous AI agents with persistent state and multi-context capabilities. It is modular, extensible, and supports both Node.js and browser environments, with optional platform and storage extensions.

---
### Project Structure
```
<root>/
│
│   
│
├── clients/
│   └── chat-example-ui/       # Example frontend client (React + Vite)
│       ├── src/
│       │   ├── agent/    # Agent logic for frontend
│       │   ├── components/   # React components (UI, chat, sidebar, etc.)
│       │   ├── hooks/    # Custom React hooks
│       │   ├── lib/      # Utility functions
│       │   ├── routes/   # App routes
│       │   └── assets/   # Static assets
│       ├── public/       # Static files (icons, images)
│       ├── package.json
│       ├── vite.config.ts
│       └── ...
│
├── docs/                 # Documentation site (Next.js)
│   ├── app/              # App routes and components for docs
│   ├── content/          # Markdown/MDX docs content
│   ├── public/           # Static assets for docs
│   ├── lib/              # Utilities for docs
│   ├── package.json
│   └── ...
│
├── examples/             # Example integrations and use cases
│   ├── basic/            # Basic chat and agent examples
│   ├── discord/          # Discord bot example
│   ├── twitter/          # Twitter agent example
│   ├── telegram/         # Telegram bot example
│   ├── sei-native/       # Sei interaction examples
│   ├── games/            # Game agent examples
│   ├── mcp/              # Model Context Protocol examples
│   └── ...
│
├── packages/             # Core and extension packages (monorepo)
│   ├── core/             # Main framework logic
│   ├── cli/              # CLI tools
│   ├── discord/          # Discord extension
│   ├── mcp/              # MCP protocol
│   ├── mongo/            # MongoDB extension
│   ├── synthetic/        # Synthetic data/analytics
│   ├── telegram/         # Telegram extension
│   ├── twitter/          # Twitter extension
│   └── ...
│
├── scripts/              # Build and utility scripts
│   ├── build.sh
│   ├── clean.sh
│   ├── release.sh
│   └── ...
│
├── README.md             # Main project documentation
├── CHANGELOG.md          # Changelog
└── ...
```

## Build & Development Instructions

### Prerequisites
- **Node.js** 18+
- **pnpm** (preferred), or npm/yarn
- **TypeScript** 4.5+

### Build PNPM Lib

### Rule JSDoc
Use the following JSDoc tags for comprehensive documentation:
- /** ... */: Start and end all JSDoc comments.
- @param {Type} name - Description.: For function parameters.
    - Type: The TypeScript type (e.g., {string}, {number[]}, {MyInterface}).
    - name: The parameter name.
    - Description: A clear explanation of the parameter's purpose.
    - Use [name] for optional parameters.

- @returns {Type} - Description.: For function return values.
- @throws {ErrorType} - Description.: For errors thrown by the function.
- @example: Provide a code example demonstrating how to use the function/class.
- @deprecated - Reason for deprecation.: Mark deprecated elements.
- @see {link}: Reference related documentation or resources.
- @template {T}: For generic types.