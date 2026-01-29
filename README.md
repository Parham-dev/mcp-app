# MCP App Store 🏪

A multi-app hosting platform for MCP (Model Context Protocol) applications. Deploy multiple AI-powered apps from a single server with shared infrastructure, security, and routing.

![MCP](https://img.shields.io/badge/MCP-Platform-blue) ![Railway](https://img.shields.io/badge/Railway-Deployed-green)

## 🎯 What Is This?

MCP App Store is a **hosting platform** that lets you:

- 🚀 Deploy multiple MCP apps from a single server
- 🔐 Shared API key authentication across all apps
- 🛤️ Automatic routing: `/{app-id}/mcp` for each app
- 📦 Single deployment to Railway/Vercel/any host
- 🔧 Easy to add new apps - just create a folder!

## 🌐 Live Platform

**Production URL**: `https://mcp-production-3a5e.up.railway.app`

### Available Apps

| App | Endpoint | Description |
|-----|----------|-------------|
| 🍳 [Recipe Remix](apps/recipe-remix/) | `/recipe-remix/mcp` | AI recipe assistant with beautiful UI |

## 🔌 Connect to Claude Desktop / VS Code

```json
{
  "servers": {
    "recipe-remix": {
      "type": "sse",
      "url": "https://mcp-production-3a5e.up.railway.app/recipe-remix/mcp"
    }
  }
}
```

## 🏗️ Architecture

```
mcp-app/
├── main.ts              # Multi-app server with routing & auth
├── app-registry.ts      # App registration system
├── apps/                # 📁 Each app lives here
│   └── recipe-remix/    # Example app
│       ├── server.ts    # Tool & resource registration
│       ├── mcp-app.tsx  # React UI entry
│       └── README.md    # App-specific docs
├── dist/                # Built HTML bundles
├── package.json
└── vite.config.ts
```

### How Routing Works

```
Request: GET /recipe-remix/mcp
              ↓
main.ts routes to apps/recipe-remix/server.ts
              ↓
App handles MCP protocol (tools, resources, UI)
              ↓
Response returned to client
```

## ➕ Adding a New App

1. **Create app folder**:
   ```bash
   mkdir -p apps/my-new-app/src
   ```

2. **Create server.ts** with your tools:
   ```typescript
   import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
   
   export function registerTools(server: McpServer) {
     server.tool("my-tool", { /* schema */ }, async (params) => {
       // Your tool logic
     });
   }
   ```

3. **Create mcp-app.tsx** for the UI:
   ```tsx
   import React from "react";
   
   export default function App({ data }) {
     return <div>{/* Your UI */}</div>;
   }
   ```

4. **Register in app-registry.ts**:
   ```typescript
   export const apps = {
     "recipe-remix": { /* ... */ },
     "my-new-app": {
       name: "My New App",
       description: "Does something cool",
       path: "./apps/my-new-app/server.ts"
     }
   };
   ```

5. **Add Vite build config** in vite.config.ts

6. **Build and test**:
   ```bash
   npm run build
   npx tsx main.ts
   ```

## 🔧 Local Development

```bash
# Install dependencies
npm install

# Build all apps
npm run build

# Start the server
npx tsx main.ts

# Server runs at http://localhost:3001
# Apps available at http://localhost:3001/{app-id}/mcp
```

### Test an App Locally

```json
{
  "servers": {
    "recipe-remix": {
      "type": "sse",
      "url": "http://localhost:3001/recipe-remix/mcp"
    }
  }
}
```

## 🚢 Deployment

Deployed on Railway with automatic builds:

```bash
railway up
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 3001 (Railway uses 8080) |
| `API_KEY` | Optional API key for auth | None (public access) |

## 🔒 Security

- **API Key Validation** - Optional - set `API_KEY` env var to enable auth via `?apiKey=` or `Bearer` header
- **CSP Support** - Apps can configure Content Security Policy for external resources
- **CORS Enabled** - Cross-origin requests supported for browser clients

## 🎨 Tech Stack

- **Server**: Express + MCP SDK with StreamableHTTPServerTransport
- **Frontend**: React 18, TypeScript, CSS Modules
- **Icons**: Lucide React (tree-shakable SVGs)
- **Animations**: Lottie React
- **Bundler**: Vite + vite-plugin-singlefile
- **Deployment**: Railway

## 📜 MCP Protocol

This platform implements the [Model Context Protocol](https://modelcontextprotocol.io/):

- **Tools** - Functions the AI can call (e.g., `show-recipe`)
- **Resources** - Data/UI the AI can display
- **Transports** - SSE for streaming, HTTP for request/response

Each app defines its own tools and resources, the platform handles:
- Protocol negotiation
- Session management
- Authentication
- Routing

## 🗺️ Roadmap

- [ ] More apps (Weather, Maps, Stocks, etc.)
- [ ] App discovery endpoint
- [ ] Usage analytics
- [ ] Rate limiting
- [ ] App versioning

## 📝 License

MIT

---

Built with ❤️ using the [MCP SDK](https://github.com/modelcontextprotocol/sdk)
