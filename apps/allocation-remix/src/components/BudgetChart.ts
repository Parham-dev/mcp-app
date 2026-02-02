/**
 * Budget Chart Component
 */
import { Chart } from "chart.js";
import type { BudgetCategory, AppState } from "../types";
import { formatCurrency } from "../utils";

export function createBudgetChart(
  canvas: HTMLCanvasElement,
  categories: BudgetCategory[],
  state: AppState,
  handlers: {
    onChartClick: (categoryId: string) => void;
    onChartHover: (categoryId: string | null) => void;
  }
): Chart<"doughnut"> {
  const isDarkMode = window.matchMedia("(prefers-color-scheme: dark)").matches;

  return new Chart(canvas, {
    type: "doughnut",
    data: {
      labels: categories.map((c) => c.name),
      datasets: [
        {
          data: categories.map(
            (c) => state.allocations.get(c.id) ?? c.defaultPercent,
          ),
          backgroundColor: categories.map((c) => c.color),
          borderWidth: 2,
          borderColor: isDarkMode ? "#1f2937" : "#ffffff",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      cutout: "60%",
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const pct = ctx.parsed;
              const amt = (pct / 100) * state.totalBudget;
              return `${ctx.label}: ${pct.toFixed(1)}% (${formatCurrency(amt, state.config?.currencySymbol)})`;
            },
          },
        },
      },
      onClick: (_event, elements) => {
        if (elements.length > 0) {
          const index = elements[0].index;
          handlers.onChartClick(categories[index].id);
        }
      },
      onHover: (_event, elements) => {
        if (elements.length > 0) {
          handlers.onChartHover(categories[elements[0].index].id);
        } else {
          handlers.onChartHover(null);
        }
      },
    },
  });
}

export function updateChart(chart: Chart<"doughnut">, categories: BudgetCategory[], state: AppState): void {
  const data = categories.map((c) => state.allocations.get(c.id) ?? 0);
  chart.data.datasets[0].data = data;
  chart.update("none");
}
