# MCP App Template

A starter template for building MCP Apps with interactive UIs.

## Features

- 🎨 **React + TypeScript** - Modern UI development
- 📦 **Single-file bundling** - Vite + vite-plugin-singlefile
- 🔌 **Dual transport** - HTTP and stdio support
- 🎯 **Host styling** - Automatic theme integration
- 🚀 **npm publishable** - Ready to distribute

## Quick Start

```bash
# Install dependencies
npm install

# Development (watch + serve)
npm run dev

# Build for production
npm run build

# Run the server
npm run serve
```

## Project Structure

```
├── package.json              # Dependencies and scripts
├── tsconfig.json             # TypeScript config (client)
├── tsconfig.server.json      # TypeScript config (server)
├── vite.config.ts            # Vite bundler config
├── server.ts                 # MCP server (tools + resources)
├── main.ts                   # Entry point (HTTP/stdio)
├── mcp-app.html              # HTML entry
└── src/
    ├── mcp-app.tsx           # React app
    ├── mcp-app.module.css    # Component styles
    ├── global.css            # Global styles
    └── vite-env.d.ts         # Vite types
```

## Usage

### HTTP Mode (default)

```bash
npm run serve
# Server runs at http://localhost:3001/mcp
```

### Stdio Mode (for Claude Desktop)

```bash
node dist/index.js --stdio
```

### Claude Desktop Configuration

Add to your Claude Desktop config:

```json
{
  "mcpServers": {
    "mcp-app-template": {
      "command": "node",
      "args": ["/path/to/mcp-app/dist/index.js", "--stdio"]
    }
  }
}
```

## Customization

### Rename Your App

1. Update `name` in `package.json`
2. Update `bin` key in `package.json`
3. Update server name in `server.ts`
4. Update app info in `src/mcp-app.tsx`

### Add New Tools

In `server.ts`, register additional tools:

```typescript
registerAppTool(server,
  "my-tool",
  {
    title: "My Tool",
    description: "Description of what it does",
    inputSchema: { /* Zod-compatible JSON schema */ },
    _meta: { ui: { resourceUri: "ui://my-tool/mcp-app.html" } },
  },
  async (args): Promise<CallToolResult> => {
    // Your tool logic
    return {
      content: [{ type: "text", text: "Result for model" }],
      structuredContent: { /* Data for UI */ },
    };
  },
);
```

## Publishing to npm

```bash
# Update version
npm version patch|minor|major

# Publish
npm publish
```

After publishing, users can run:

```bash
npx mcp-app-template
```

## License

MIT
