# Recipe Remix

AI-powered recipe assistant with beautiful UI and smart substitutions.

## How It Works

```
User: "How do I make carbonara?"
         ↓
AI generates full recipe → passes to app as tool input:
{
  name: "Spaghetti Carbonara",
  servings: 4,
  ingredients: [
    { name: "guanciale", amount: 200, unit: "g" },
    { name: "egg yolks", amount: 4, unit: "pcs" },
    ...
  ],
  steps: [...]
}
         ↓
App renders recipe UI
         ↓
User interacts → AI helps adapt
```

## Features

| Action | Method | What Happens |
|--------|--------|--------------|
| Click ingredient → "Substitute" | `sendMessage()` | AI suggests alternatives |
| Click ingredient → "I don't have this" | `sendMessage()` | AI adapts recipe |
| Adjust servings slider | UI only | Auto-recalculates amounts |
| Click step → "Explain more" | `sendMessage()` | AI gives detailed tips |
| Save my version | `callServerTool()` | Store modified recipe |

## User Flow

1. **Ask** - "How do I make pad thai?"
2. **View** - AI sends recipe, app displays beautifully
3. **Adapt** - Click ingredient → "I'm allergic" / "Make vegetarian"
4. **Learn** - Click step → "Show me how to julienne"
5. **Save** - Store your personalized version

## Why This Works

- **AI knows recipes** - No database needed
- **App handles UI** - Servings slider, timers, checkboxes
- **AI handles adaptation** - Substitutions, allergies, preferences
- **Server stores memory** - Your modifications, favorites, notes

## Example Interactions

```
User clicks "guanciale" → "Substitute"
AI: "Use pancetta or thick-cut bacon. 
     Pancetta is closest in flavor..."

User clicks "Adjust servings" → drags to 2
App: Automatically shows "100g guanciale, 2 egg yolks..."

User clicks step 3 → "I don't understand"
AI: "Here's the key: add the egg mixture OFF heat
     to avoid scrambling. The pasta's residual heat
     will cook it gently..."
```

## Images

Ingredient images via:
- Category icons (🥩🧀🥚🌶️) as default
- Unsplash fallback: `source.unsplash.com/100x100/?{ingredient}`
