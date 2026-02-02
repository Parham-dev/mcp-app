# Budget Allocator

An interactive budget allocation tool demonstrating real-time data visualization with MCP Apps.

## Features

- **Interactive Sliders**: Adjust budget allocation across 5 categories (Marketing, Engineering, Operations, Sales, R&D)
- **Donut Chart**: Real-time visualization of allocation distribution using Chart.js
- **Sparkline Trends**: 24-month historical allocation data per category
- **Percentile Badges**: Compare your allocation vs. industry benchmarks
- **Stage Selector**: Switch between Seed, Series A, Series B, and Growth benchmarks
- **Budget Presets**: Quick selection of $50K, $100K, $250K, or $500K totals

## Architecture

### Server

Exposes a single `get-budget-data` tool that returns:
- Category definitions with colors and default allocations
- Historical data - 24 months of allocation history per category
- Industry benchmarks - Aggregated percentile data by company stage

### App

- Uses Chart.js for the donut chart visualization
- Renders sparkline trends using inline SVG
- Computes percentile rankings client-side from benchmark data
- Updates all UI elements reactively on slider changes
