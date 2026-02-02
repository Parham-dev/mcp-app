# Allocation Remix

A dynamic, AI-powered resource allocation visualizer that adapts to any allocation scenario. Built with a component-based architecture for maintainability and reusability.

## Universal Resource Allocation

Unlike traditional static tools, **Allocation Remix** is driven by AI. The AI determines categories, amounts, and context based on your needs:

### Use Cases:
- 💰 **Personal Finance**: Rent, Food, Transportation, Savings, Entertainment
- 📊 **Company Budgets**: Marketing, Engineering, Operations, Sales, R&D  
- ⏰ **Time Management**: Work, Sleep, Exercise, Family, Hobbies
- 🎯 **Project Resources**: Development, Design, Infrastructure, Support
- 👥 **Team Allocation**: Frontend, Backend, DevOps, QA, Design
- 📱 **Marketing Budget**: Social Ads, Content, Events, Email, SEO

## Features

- **Dynamic Categories**: 2-10 categories defined by AI based on context
- **Interactive Sliders**: Real-time adjustment with live chart updates
- **Donut Chart**: Visual distribution using Chart.js
- **Sparkline Trends**: Optional historical data visualization
- **Percentile Badges**: Optional benchmark comparisons (if AI provides them)
- **Flexible Units**: $ for money, hours for time, points for resources, etc.
- **Preset Amounts**: Quick selection of common allocation totals

## How It Works

### AI-Driven Input
The AI provides everything via the `show-allocation` tool:
```typescript
{
  title: "My Monthly Budget",
  totalAmount: 5000,
  currencySymbol: "$",
  categories: [
    { id: "rent", name: "Rent", color: "#3b82f6", defaultPercent: 30 },
    { id: "food", name: "Food", color: "#10b981", defaultPercent: 20 },
    // ... more categories
  ],
  history: [...],      // Optional
  benchmarks: [...]    // Optional
}
```

### User Prompts
- "Help me allocate my $5000 monthly budget"
- "Show me a time allocation for an 8-hour workday"
- "I need to split my marketing budget across channels"
- "Create a project resource plan for my team"

The AI interprets the request, creates appropriate categories, and calls the tool.

## Architecture

### Component-Based Structure

```
src/
├── components/          Component modules
│   ├── BudgetChart.ts       - Chart.js donut chart with interactions
│   ├── SliderRow.ts         - Category slider with sparkline visualization
│   ├── StatusBar.ts         - Real-time allocation status display
│   ├── ComparisonBar.ts     - Industry benchmark comparison logic
│   ├── Selectors.ts         - Budget & stage dropdown selectors
│   ├── PercentileBadge.ts   - Percentile badge calculation & display
│   └── index.ts             - Component exports
├── types/              TypeScript interfaces
│   └── index.ts            - BudgetCategory, AppState, etc.
├── utils/              Utility functions
│   ├── format.ts           - Currency formatting helpers
│   ├── percentile.ts       - Percentile calculations
│   ├── sparkline.ts        - Canvas sparkline drawing
│   └── index.ts            - Utility exports
├── mcp-app.ts          Main orchestrator (225 lines)
├── mcp-app.css         Component styles
└── global.css          Global styles
```

### Server (`server.ts`)

Exposes a single `get-budget-data` tool that returns:
- Category definitions with colors and default allocations
- Historical data - 24 months of allocation history per category
- Industry benchmarks - Aggregated percentile data by company stage

### App Bundle

- **Size**: 509KB (gzip: 135KB)
- **Framework**: Vanilla TypeScript with component pattern
- **Chart Library**: Chart.js for donut visualization
- **Single-file output**: All dependencies bundled via Vite

## Development

The refactored architecture provides:
- ✅ **Separation of concerns**: Each component handles one responsibility
- ✅ **Reusability**: Components can be tested and modified independently
- ✅ **Type safety**: Full TypeScript coverage with shared types
- ✅ **Maintainability**: Clear structure following MCP app best practices
