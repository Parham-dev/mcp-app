# Recipe Remix 🍳

AI-powered recipe assistant with beautiful UI, smart substitutions, and interactive cooking experience.

![Recipe Remix](https://img.shields.io/badge/MCP-App-blue) ![Railway](https://img.shields.io/badge/Railway-Deployed-green)

## ✨ Features

- **🎨 Beautiful Recipe Cards** - Clean, modern UI with Lucide icons
- **📊 Health Score Meter** - Visual health rating with animated gauge
- **🔄 Servings Slider** - Auto-recalculates ingredient amounts
- **💬 AI Substitutions** - Click any ingredient to get alternatives
- **📝 Step-by-step Instructions** - Clear cooking steps with timing
- **🍲 Lottie Animations** - Smooth cooking pot animation while loading
- **🌙 Dark Mode** - Automatic theme support for VS Code/Claude Desktop

## 🚀 Live Demo

**Production URL**: `https://mcp-production-3a5e.up.railway.app`

### Connect to Claude Desktop or VS Code

```json
{
  "servers": {
    "recipe-remix": {
      "type": "sse",
      "url": "https://mcp-production-3a5e.up.railway.app/recipe-remix/mcp?apiKey=YOUR_API_KEY"
    }
  }
}
```

## 🎯 How It Works

```
User: "How do I make carbonara?"
         ↓
AI generates full recipe → passes to show-recipe tool:
{
  name: "Spaghetti Carbonara",
  servings: 4,
  healthScore: 6,
  ingredients: [
    { name: "guanciale", amount: 200, unit: "g", category: "protein" },
    { name: "egg yolks", amount: 4, unit: "pcs", category: "protein" },
    ...
  ],
  steps: [...]
}
         ↓
App renders beautiful recipe UI
         ↓
User interacts → AI helps adapt
```

## 🛠️ User Interactions

| Action | What Happens |
|--------|--------------|
| 🔄 Click ingredient substitute icon | AI suggests alternatives |
| 📏 Adjust servings slider | Auto-recalculates all amounts |
| ❓ Click step for help | AI gives detailed cooking tips |
| 📊 View health score | See nutritional rating (0-10) |

## 🏗️ Architecture

```
mcp-app/
├── main.ts                   # Multi-app MCP server with API key auth
├── app-registry.ts           # App registration system
├── apps/
│   └── recipe-remix/
│       ├── server.ts         # Tool & resource registration
│       ├── mcp-app.tsx       # React app entry
│       ├── mcp-app.module.css # Styles with animations
│       └── src/
│           ├── components/   # UI components
│           │   ├── RecipeHeader.tsx
│           │   ├── ServingsSlider.tsx
│           │   ├── IngredientList.tsx
│           │   ├── IngredientImage.tsx
│           │   ├── StepsList.tsx
│           │   ├── HealthScoreMeter.tsx
│           │   ├── EmptyState.tsx
│           │   └── LoadingAnimation.tsx
│           ├── types/        # TypeScript types
│           └── utils/        # Helper functions
└── dist/                     # Built HTML bundles
```

## 🔧 Local Development

```bash
# Install dependencies
npm install

# Build the app
npm run build

# Start the server
npx tsx main.ts

# Server runs at http://localhost:3001
```

### VS Code Local Config

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

Environment variables:
- `PORT` - Server port (default: 3001, Railway uses 8080)
- `API_KEY` - Optional API key for authentication

## 🎨 Tech Stack

- **Frontend**: React 18, TypeScript, CSS Modules
- **Icons**: Lucide React (tree-shakable SVGs)
- **Animations**: Lottie React
- **Bundler**: Vite + vite-plugin-singlefile
- **Server**: Express + MCP SDK
- **Deployment**: Railway

## 📱 Screenshots

The app renders:
1. **Recipe Header** - Name, description, prep/cook times
2. **Health Score** - Animated gauge (0=indulgent, 10=healthy)
3. **Servings Slider** - Adjust portions dynamically
4. **Ingredients Grid** - Cards with icons and substitution buttons
5. **Steps List** - Numbered instructions with durations
6. **Notes Section** - Chef tips and variations

## 🔒 Security

- API key validation via header or query parameter
- CSP configured for external image sources
- CORS enabled for cross-origin requests

## 📝 License

MIT

---

Built with ❤️ using the [MCP Apps SDK](https://github.com/modelcontextprotocol/ext-apps)
