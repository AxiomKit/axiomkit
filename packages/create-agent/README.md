# 🧪 @axiomkit/create-agent

A CLI tool for quickly bootstrapping **Axiomkit agents** with minimal setup.

## 🚀 Usage
To create a new agent named my-agent, run:
### Using `npx` (Recommended)
```bash
npx @axiomkit/create-agent my-agent
```

### Global Installation
Alternatively, you can install the package globally and then run the command:
```bash
npm install -g @axiomkit/create-agent
```
Then, you can simply use:

```bash
create-agent my-agent
```

## ⚙️ Options
You can specify extensions directly when creating a new agent using the following flags:

```bash
npx @axiomkit/create-agent my-agent --telegram --cli
```
**Available Extensions**
- --cli – Include the CLI extension
- --telegram – Include the Telegram extension
- --all – Include all available extensions
- --twitter – (Upcoming)
- --discord – (Upcoming)

💡 If no extensions are specified, the CLI will prompt you to select which ones to include interactively.

## 🛠️ What It Does
This tool automates the initial setup by performing the following actions:
- Creates a new directory for your agent (or uses the current one if specified).
- Sets up package.json with all necessary dependencies.
- Generates an index.js file pre-configured with your selected extensions.
- Creates a .env.example file, outlining all required environment variables.
- Installs all project dependencies.

## 📦 License
MIT ©Axiomtkit