# Recipe Remix 🍳

AI-powered recipe assistant with beautiful UI, smart substitutions, and interactive cooking experience.

## ✨ Features

- **🎨 Beautiful Recipe Cards** - Clean, modern UI with Lucide icons
- **📊 Health Score Meter** - Visual health rating with animated gauge
- **🔄 Servings Slider** - Auto-recalculates ingredient amounts
- **💬 AI Substitutions** - Click any ingredient to get alternatives
- **📝 Step-by-step Instructions** - Clear cooking steps with timing
- **🍲 Lottie Animations** - Smooth cooking pot animation while loading
- **🌙 Dark Mode** - Automatic theme support for VS Code/Claude Desktop

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

## 📁 Structure

```
recipe-remix/
├── server.ts              # Tool & resource registration
├── mcp-app.tsx            # React app entry
├── mcp-app.module.css     # Styles with animations
└── src/
    ├── components/        # UI components
    │   ├── RecipeHeader.tsx
    │   ├── ServingsSlider.tsx
    │   ├── IngredientList.tsx
    │   ├── IngredientImage.tsx
    │   ├── StepsList.tsx
    │   ├── HealthScoreMeter.tsx
    │   ├── EmptyState.tsx
    │   └── LoadingAnimation.tsx
    ├── types/             # TypeScript types
    └── utils/             # Helper functions
```

## 📱 UI Components

1. **Recipe Header** - Name, description, prep/cook times
2. **Health Score** - Animated gauge (0=indulgent, 10=healthy)
3. **Servings Slider** - Adjust portions dynamically
4. **Ingredients Grid** - Cards with icons and substitution buttons
5. **Steps List** - Numbered instructions with durations
6. **Notes Section** - Chef tips and variations

## 🔧 Configuration

The app endpoint is: `/{app-id}/mcp` → `/recipe-remix/mcp`

CSP is configured to allow external images from TheMealDB for ingredient photos.
