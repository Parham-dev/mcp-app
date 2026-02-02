/**
 * Budget Allocator App - Interactive budget allocation with real-time visualization
 * Refactored with component-based architecture
 */
import { App, type McpUiHostContext } from "@modelcontextprotocol/ext-apps";
import type { BudgetDataResponse, AppState } from "./types";
import {
  createBudgetChart,
  updateChart,
  createSliderRow,
  updateSliderDisplay,
  updateStatusBar,
  updateComparisonSummary,
  initBudgetSelector,
  initStageSelector,
  updatePercentileBadge,
  updateAllPercentileBadges,
} from "./components";
import "./global.css";
import "./mcp-app.css";

// Logger
const log = {
  info: console.log.bind(console, "[APP]"),
  error: console.error.bind(console, "[APP]"),
};

// Global state
const state: AppState = {
  config: null,
  analytics: null,
  totalBudget: 100000,
  allocations: new Map(),
  selectedStage: "Series A",
  chart: null,
};

// DOM References
const appContainer = document.querySelector(".app-container") as HTMLElement;
const titleElement = document.querySelector(".title") as HTMLElement;
const budgetSelector = document.getElementById("budget-selector") as HTMLSelectElement;
const stageSelector = document.getElementById("stage-selector") as HTMLSelectElement;
const slidersContainer = document.getElementById("sliders-container")!;
const statusBar = document.getElementById("status-bar")!;
const comparisonSummary = document.getElementById("comparison-summary")!;
const chartCanvas = document.getElementById("budget-chart") as HTMLCanvasElement;

// ---------------------------------------------------------------------------
// Slider Interaction Handlers
// ---------------------------------------------------------------------------

function handleSliderChange(categoryId: string, newPercent: number): void {
  state.allocations.set(categoryId, newPercent);
  
  const symbol = state.config?.currencySymbol ?? "$";
  updateSliderDisplay(categoryId, newPercent, state.totalBudget, symbol);
  
  if (state.chart && state.config) {
    updateChart(state.chart, state.config.categories, state);
  }
  
  updateStatusBar(statusBar, state.allocations, state.totalBudget, symbol);
  
  // Only update benchmarks if they exist
  if (state.config && state.analytics && state.analytics.benchmarks && state.analytics.benchmarks.length > 0) {
    updatePercentileBadge(
      categoryId,
      state.config.categories,
      state.allocations,
      state.analytics,
      state.selectedStage,
    );
    updateComparisonSummary(
      comparisonSummary,
      state.allocations,
      state.config.categories,
      state.analytics,
      state.selectedStage,
    );
  }
}

function focusSlider(categoryId: string): void {
  const slider = document.querySelector(
    `.slider-row[data-category-id="${categoryId}"] .slider`,
  ) as HTMLInputElement | null;
  if (slider) {
    slider.focus();
    highlightSlider(categoryId);
  }
}

function highlightSlider(categoryId: string | null): void {
  clearSliderHighlight();
  if (categoryId) {
    const row = document.querySelector(
      `.slider-row[data-category-id="${categoryId}"]`,
    );
    if (row) {
      row.classList.add("highlighted");
    }
  }
}

function clearSliderHighlight(): void {
  document
    .querySelectorAll(".slider-row.highlighted")
    .forEach((el) => el.classList.remove("highlighted"));
}

function updateAllSliderAmounts(): void {
  if (!state.config) return;
  const symbol = state.config.currencySymbol;
  for (const category of state.config.categories) {
    const percent = state.allocations.get(category.id) ?? 0;
    updateSliderDisplay(category.id, percent, state.totalBudget, symbol);
  }
}

// ---------------------------------------------------------------------------
// Selector Handlers
// ---------------------------------------------------------------------------

function handleBudgetChange(newBudget: number): void {
  state.totalBudget = newBudget;
  updateAllSliderAmounts();
  if (state.config) {
    updateStatusBar(
      statusBar,
      state.allocations,
      state.totalBudget,
      state.config.currencySymbol,
    );
  }
}

function handleStageChange(newStage: string): void {
  state.selectedStage = newStage;
  if (state.config && state.analytics) {
    updateAllPercentileBadges(
      state.config.categories,
      state.allocations,
      state.analytics,
      state.selectedStage,
    );
    updateComparisonSummary(
      comparisonSummary,
      state.allocations,
      state.config.categories,
      state.analytics,
      state.selectedStage,
    );
  }
}

// ---------------------------------------------------------------------------
// Main Initialization
// ---------------------------------------------------------------------------

function initializeUI(config: typeof state.config, analytics: typeof state.analytics): void {
  if (!config) return;
  
  state.config = config;
  state.analytics = analytics;
  state.totalBudget = config.defaultBudget;
  state.selectedStage = analytics?.defaultStage ?? "";

  // Update title if provided
  if (config.title) {
    titleElement.textContent = config.title;
  }

  // Initialize allocations with defaults
  for (const category of config.categories) {
    state.allocations.set(category.id, category.defaultPercent);
  }

  // Initialize selectors
  initBudgetSelector(
    budgetSelector,
    config.presetBudgets,
    config.defaultBudget,
    config.currencySymbol,
    handleBudgetChange,
  );
  
  // Only show stage selector if benchmarks exist
  if (analytics && analytics.benchmarks && analytics.benchmarks.length > 0) {
    stageSelector.style.display = "";
    stageSelector.parentElement!.style.display = "flex";
    initStageSelector(
      stageSelector,
      analytics.stages,
      analytics.defaultStage,
      handleStageChange,
    );
  } else {
    stageSelector.style.display = "none";
    stageSelector.parentElement!.style.display = "none";
    comparisonSummary.parentElement!.style.display = "none";
  }

  // Create slider rows
  slidersContainer.innerHTML = "";
  for (const category of config.categories) {
    const historyData = analytics?.history?.map(
      (h) => h.allocations[category.id] ?? 0,
    ) ?? [];
    const row = createSliderRow(category, historyData, state, handleSliderChange);
    slidersContainer.appendChild(row);
  }

  // Initialize chart
  state.chart = createBudgetChart(chartCanvas, config.categories, state, {
    onChartClick: focusSlider,
    onChartHover: highlightSlider,
  });

  // Update all displays
  if (analytics && analytics.benchmarks && analytics.benchmarks.length > 0) {
    updateAllPercentileBadges(
      config.categories,
      state.allocations,
      analytics,
      state.selectedStage,
    );
    
    updateComparisonSummary(
      comparisonSummary,
      state.allocations,
      config.categories,
      analytics,
      state.selectedStage,
    );
  }
  
  updateStatusBar(
    statusBar,
    state.allocations,
    state.totalBudget,
    config.currencySymbol,
  );

  const historyCount = analytics?.history?.length ?? 0;
  log.info("UI initialized", historyCount > 0 ? `with ${historyCount} periods of history` : "without history");
}

// ---------------------------------------------------------------------------
// App Connection
// ---------------------------------------------------------------------------

const app = new App({ name: "Budget Allocator", version: "1.0.0" });

app.ontoolresult = (result) => {
  log.info("Received tool result:", result);
  const data = result.structuredContent as unknown as BudgetDataResponse;
  if (data?.config && data?.analytics) {
    initializeUI(data.config, data.analytics);
  }
};

app.onerror = log.error;

function handleHostContextChanged(ctx: McpUiHostContext) {
  if (ctx.safeAreaInsets) {
    appContainer.style.paddingTop = `${ctx.safeAreaInsets.top}px`;
    appContainer.style.paddingRight = `${ctx.safeAreaInsets.right}px`;
    appContainer.style.paddingBottom = `${ctx.safeAreaInsets.bottom}px`;
    appContainer.style.paddingLeft = `${ctx.safeAreaInsets.left}px`;
  }
}

app.onhostcontextchanged = handleHostContextChanged;

// Handle theme changes - reinitialize chart
window
  .matchMedia("(prefers-color-scheme: dark)")
  .addEventListener("change", () => {
    if (state.chart && state.config) {
      state.chart.destroy();
      state.chart = createBudgetChart(chartCanvas, state.config.categories, state, {
        onChartClick: focusSlider,
        onChartHover: highlightSlider,
      });
    }
  });

// Connect to host
app.connect().then(() => {
  const ctx = app.getHostContext();
  if (ctx) {
    handleHostContextChanged(ctx);
  }
});
