# Axiomkit Documentation

This is the official documentation site for Axiomkit, a TypeScript framework for building autonomous AI agents.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ or Bun
- npm, yarn, or pnpm

### Installation

```bash
# Install dependencies
npm install

# Start the development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## 📚 Documentation Structure

The documentation is organized into several main sections:

### Getting Started
- **Quick Start** - Get up and running with Axiomkit in minutes
- **First AI Agent** - Build your first AI agent step by step

### Agent Architecture
- **Agent Architecture** - Core concepts and component overview
- **Context** - Managing conversation contexts and state
- **Prompt** - Crafting effective prompts for your agents
- **Input** - Handling different types of input
- **Actions** - Creating custom actions for your agents
- **Memory** - Implementing memory systems
- **Extensions** - Using and creating extensions
- **LLM Providers** - Working with different language models

### Examples
- **Examples** - Real-world examples and use cases

### Development
- **Roadmap** - Future development plans and features

## 🛠️ Development

### Local Development

```bash
# Start development server with hot reload
npm run dev

# The site will be available at http://localhost:3000
```

### Adding New Pages

1. Create a new `.mdx` file in `content/docs/`
2. Add the page to `content/meta.json` navigation
3. Use the proper frontmatter format:

```mdx
---
title: Your Page Title
description: Brief description of the page
---

# Your Page Title

Your content here...
```

### Styling

The documentation uses:
- **Tailwind CSS** for styling
- **MDX** for content with React components
- **Fumadocs** for the documentation framework

### Components

Available components for use in MDX files:

- `<Cards>` - Display a grid of cards
- `<Card>` - Individual card component
- `<Tabs>` - Tabbed content
- `<CodeBlock>` - Syntax-highlighted code blocks

## 📖 Content Guidelines

### Writing Style

- **Clear and concise** - Explain concepts clearly without unnecessary jargon
- **Implementation-focused** - Provide practical examples and code snippets
- **Problem-solving** - Explain what problems each feature solves
- **Progressive disclosure** - Start simple, then add complexity

### Code Examples

- Use TypeScript for all code examples
- Include complete, runnable examples
- Add comments to explain complex parts
- Use realistic but simple examples

### Structure

Each page should include:
1. **Overview** - What the feature is and why it exists
2. **Basic Usage** - Simple examples to get started
3. **Advanced Usage** - More complex scenarios
4. **Best Practices** - Tips and recommendations
5. **Related Links** - Links to related documentation

## 🔧 Configuration

### Fumadocs Configuration

The site uses Fumadocs for documentation generation. Key configuration files:

- `source.config.ts` - Main configuration
- `next.config.mjs` - Next.js configuration
- `tailwind.config.ts` - Tailwind CSS configuration

### Customization

To customize the documentation site:

1. **Styling** - Modify `tailwind.config.ts` and CSS files
2. **Layout** - Edit components in `app/` directory
3. **Navigation** - Update `content/meta.json`
4. **Search** - Configure search in `source.config.ts`

## 🚀 Deployment

### Vercel (Recommended)

```bash
# Deploy to Vercel
npx vercel

# Or connect your GitHub repository for automatic deployments
```

### Other Platforms

The site can be deployed to any platform that supports Next.js:

- **Netlify** - `npm run build && netlify deploy`
- **Railway** - Connect GitHub repository
- **Docker** - Use the provided Dockerfile

## 🤝 Contributing

We welcome contributions to the documentation!

### How to Contribute

1. **Fork the repository**
2. **Create a feature branch** - `git checkout -b feature/your-feature`
3. **Make your changes** - Edit documentation files
4. **Test locally** - `npm run dev` to preview changes
5. **Submit a pull request** - Include a description of your changes

### Documentation Standards

- **Accuracy** - Ensure all information is correct and up-to-date
- **Completeness** - Cover all important aspects of features
- **Clarity** - Write in clear, understandable language
- **Examples** - Include practical, working examples
- **Links** - Add relevant links to related documentation

### Review Process

1. **Automated checks** - CI/CD will run linting and build checks
2. **Manual review** - Maintainers will review your changes
3. **Feedback** - Address any feedback or requested changes
4. **Merge** - Once approved, your changes will be merged

## 📞 Support

If you need help with the documentation:

- **GitHub Issues** - Open an issue for bugs or feature requests
- **Discussions** - Join GitHub Discussions for questions
- **Discord** - Join our Discord community
- **Email** - Contact us directly for urgent issues

## 📄 License

This documentation is licensed under the same license as Axiomkit itself.

## 🙏 Acknowledgments

Thanks to all contributors who help maintain and improve this documentation!

---

**Need help?** Check out our [Quick Start Guide](/docs/quick-start) or [join our community](https://discord.gg/axiomkit).
