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

## 🚀 MCP App Store Launch Suite

Apps designed for **mcpapp-store.com** - fast to build, can't be done by AI alone, with clear free/paid tiers.

### Why These Apps?

MCP Apps are valuable when they:
- **Connect to external services** AI can't access
- **Take real actions** in the world
- **Show real-time data** from APIs
- **Create downloadable files** (images, PDFs, etc.)

---

### Tier 1: Quick Wins (1-2 days each) ⚡

| App | What it does | Free Limit | Paid |
|-----|--------------|------------|------|
| **🔗 URL Shortener** | Create short links + click analytics | 10/month | Unlimited + custom domains |
| **📸 Screenshot Capture** | Take screenshot of any URL | 5/month | Unlimited + full page |
| **🎨 Color Palette** | Extract colors from image/URL | 10/month | Unlimited + export |
| **⏱️ Pomodoro Timer** | Focus timer with stats | Free | Sync across devices |
| **📋 Clipboard Manager** | Save/retrieve snippets | 5 items | Unlimited history |
| **🔲 QR Code Generator** | Generate QR codes for URLs/text | 10/month | Unlimited + custom styling |

---

### Tier 2: API-Powered (3-5 days each) 🔌

| App | What it does | Free Limit | Paid |
|-----|--------------|------------|------|
| **🌤️ Weather Widget** | Current weather + forecast | 10 lookups/day | Unlimited + alerts |
| **💱 Currency Converter** | Live exchange rates | 20/day | Unlimited + historical |
| **📰 News Feed** | Headlines from topic/source | 5 queries/day | Unlimited + custom feeds |
| **🔍 WHOIS Lookup** | Domain info checker | 5/day | Unlimited |
| **📊 Website Analytics** | Site speed, SEO score | 3/day | Unlimited + reports |
| **💰 Crypto Tracker** | Live prices + charts | 10/day | Unlimited + alerts |

---

### Tier 3: Power Apps (1 week each) 💪

| App | What it does | Free Limit | Paid |
|-----|--------------|------------|------|
| **📧 Email Sender** | Send emails via AI | 5/month | 100/month + templates |
| **📱 SMS Sender** | Send text messages | 3/month | 50/month |
| **📅 Calendar** | View/create events (Google) | Read only | Full access |
| **📝 PDF Generator** | Create PDFs from text | 3/month | Unlimited |
| **🖼️ Image Editor** | Resize, crop, filter | 5/month | Unlimited + batch |

---

### 🎯 Launch Roadmap

**Week 1 - Launch with 3 apps:**
1. **URL Shortener** - Easy, useful, clear monetization
2. **Weather Widget** - Visual, real-time data
3. **Screenshot Capture** - "Show me this website" → image

**Week 2 - Add 3 more:**
4. Currency Converter
5. Color Palette Extractor  
6. Website Analytics

**Week 3+ - Expand:**
- Power apps based on user demand
- Developer API access

---

### 💰 Pricing Strategy

```
FREE:        Limited uses per month
PRO:         $5/month - All apps unlimited
DEVELOPER:   $15/month - API access + self-host license
```

---

### 🏗️ Tech Stack for Deployment

```
Server:      Node.js + Express (same as this template)
Hosting:     Railway ($5/app) or Cloudflare Workers (free tier)
Database:    Supabase (usage tracking, user limits)
Auth:        Clerk or Supabase Auth
Payments:    Stripe
```

---

### 📦 Distribution Model

| Host | Server Location | How users add it |
|------|-----------------|------------------|
| **Claude.ai** | Hosted (mcpapp-store.com) | Add URL as Custom Connector |
| **ChatGPT** | Hosted (mcpapp-store.com) | Add URL as Custom Connector |
| **Claude Desktop** | Local (npm) | `npx @mcpapp/app-name --stdio` |
| **VS Code** | Either | HTTP URL or local command |

---

## 🎯 Legacy MCP App Ideas

### Developer Tools

| Idea | Description | Complexity |
|------|-------------|------------|
| **Mermaid Diagram Renderer** | LLM generates Mermaid code → instant flowchart | Medium |
| **JSON/Data Visualizer** | Tree view, table view, chart view for any JSON | Medium |
| **Regex Tester** | Real-time regex testing with match highlighting | Low |
| **Code Diff Viewer** | Side-by-side diffs with syntax highlighting | Medium |
| **API Response Explorer** | Explore nested API responses visually | Medium |
| **Git Commit Graph** | Visualize branch history beautifully | Medium |
| **Dependency Tree Viewer** | npm/package.json → visual dependency graph | Medium |
| **Database Schema Visualizer** | SQL schema → ER diagram | High |

### AI-Native Apps

| Idea | Description | Complexity |
|------|-------------|------------|
| **Prompt Template Builder** | Build/test/save prompt templates with variables | Medium |
| **Token Counter/Cost Estimator** | Visualize token usage, estimate API costs | Low |
| **Conversation Flowchart** | Turn chat history into visual flowchart | High |

### Business/Productivity

| Idea | Description | Complexity |
|------|-------------|------------|
| **Invoice Generator** | Generate beautiful PDF invoices | Medium |
| **Meeting Timer** | Countdown + agenda tracker | Low |
| **Kanban Board** | Simple task board in chat | Medium |

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

