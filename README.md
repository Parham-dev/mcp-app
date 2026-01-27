# MCP App Template

A starter template for building MCP Apps with interactive UIs that run inside AI hosts like Claude Desktop and VS Code Copilot.

## What is an MCP App?

MCP Apps extend the Model Context Protocol to deliver interactive user interfaces. Instead of just text responses, your tools can render rich UIs: charts, forms, visualizations, and more.

```
Host calls tool → Server returns result → Host renders UI → User interacts
```

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
├── src/
│   ├── mcp-app.tsx           # React app
│   ├── mcp-app.module.css    # Component styles
│   ├── global.css            # Global styles
│   └── vite-env.d.ts         # Vite types
├── examples/                 # Example MCP Apps from ext-apps SDK
└── .github/skills/           # GitHub Copilot skills for MCP development
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

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "mcp-app-template": {
      "command": "npx",
      "args": ["tsx", "/path/to/mcp-app/main.ts", "--stdio"]
    }
  }
}
```

### VS Code Configuration

Add to `.vscode/mcp.json`:

```json
{
  "servers": {
    "mcp-app-template": {
      "type": "http",
      "url": "http://localhost:3001/mcp"
    }
  }
}
```

## Testing with UI

MCP Apps UI is supported in:
- **VS Code Insiders** - Agent mode renders UI inline
- **basic-host** - Test harness at `examples/basic-host/`

To test with basic-host:
```bash
cd examples/basic-host && npm install
SERVERS='["http://localhost:3001/mcp"]' npm run start
# Open http://localhost:8080
```

---

## 🎯 MCP App Ideas

### Tier 1: High Impact, Zero Cost ⭐

| Idea | Description | Complexity |
|------|-------------|------------|
| **Mermaid Diagram Renderer** | LLM generates Mermaid code → instant flowchart/sequence diagram | Medium |
| **JSON/Data Visualizer** | Tree view, table view, chart view for any JSON data | Medium |
| **Regex Tester** | Real-time regex testing with match highlighting | Low |
| **Color Palette Generator** | AI suggests palettes, export to CSS/Tailwind | Low |
| **Markdown Previewer** | Real-time render with themes, export options | Low |
| **Code Diff Viewer** | Side-by-side diffs with syntax highlighting | Medium |

### Tier 2: Developer Tools

| Idea | Description | Complexity |
|------|-------------|------------|
| **API Response Explorer** | Explore nested API responses visually | Medium |
| **Git Commit Graph** | Visualize branch history beautifully | Medium |
| **Dependency Tree Viewer** | npm/package.json → visual dependency graph | Medium |
| **Database Schema Visualizer** | SQL schema → ER diagram | High |

### Tier 3: AI-Native Apps

| Idea | Description | Complexity |
|------|-------------|------------|
| **Prompt Template Builder** | Build/test/save prompt templates with variables | Medium |
| **Token Counter/Cost Estimator** | Visualize token usage, estimate API costs | Low |
| **Conversation Flowchart** | Turn chat history into visual flowchart | High |

### Tier 4: Business/Productivity

| Idea | Description | Complexity |
|------|-------------|------------|
| **Invoice Generator** | Generate beautiful PDF invoices | Medium |
| **Meeting Timer** | Countdown + agenda tracker | Low |
| **Kanban Board** | Simple task board in chat | Medium |

### Top Recommendations

1. **Mermaid Diagram Renderer** - Perfect showcase: "AI generates, UI renders"
2. **JSON/Data Visualizer** - Universal utility for developers
3. **Color Palette Generator** - Beautiful, shareable, great for social media

---

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
    inputSchema: MyInputSchema, // Zod schema
    _meta: { ui: { resourceUri: "ui://my-tool/mcp-app.html" } },
  },
  async (args): Promise<CallToolResult> => {
    const parsed = MyInputSchema.parse(args);
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
npx your-mcp-app-name
```

## Examples

The `examples/` folder contains reference implementations from the MCP Apps SDK:

| Example | Description |
|---------|-------------|
| `basic-server-react/` | React template with useApp hook |
| `wiki-explorer-server/` | Wikipedia link graph visualization |
| `map-server/` | Interactive 3D globe with CesiumJS |
| `shadertoy-server/` | Real-time GLSL shader rendering |
| `scenario-modeler-server/` | SaaS business projections |
| `transcript-server/` | Live speech transcription |
| `system-monitor-server/` | Real-time CPU/memory charts |

## Resources

- [MCP Apps Specification](https://modelcontextprotocol.io/docs/concepts/apps)
- [ext-apps SDK](https://github.com/modelcontextprotocol/ext-apps)
- [MCP Documentation](https://modelcontextprotocol.io/)

## License

MIT

