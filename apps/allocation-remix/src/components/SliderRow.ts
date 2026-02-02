/**
 * Slider Row Component
 */
import type { BudgetCategory, AppState } from "../types";
import { formatCurrency, drawSparkline } from "../utils";

export function createSliderRow(
  category: BudgetCategory,
  historyData: number[],
  state: AppState,
  onSliderChange: (categoryId: string, newPercent: number) => void,
): HTMLElement {
  const allocation =
    state.allocations.get(category.id) ?? category.defaultPercent;
  const amount = (allocation / 100) * state.totalBudget;
  const symbol = state.config?.currencySymbol ?? "$";

  // Calculate trend info for tooltip (only if history exists)
  let tooltipText = "No historical data";
  if (historyData && historyData.length > 1) {
    const firstVal = historyData[0] ?? 0;
    const lastVal = historyData[historyData.length - 1] ?? 0;
    const trendDiff = lastVal - firstVal;
    const trendArrow =
      Math.abs(trendDiff) < 0.5 ? "" : trendDiff > 0 ? " +" : " ";
    tooltipText = `Past allocations: ${firstVal.toFixed(0)}%${trendArrow}${trendDiff.toFixed(1)}%`;
  }

  const row = document.createElement("div");
  row.className = "slider-row";
  row.dataset.categoryId = category.id;

  row.innerHTML = `
    <label class="slider-label" style="--category-color: ${category.color}">
      <span class="color-dot"></span>
      <span class="label-text">${category.name}</span>
    </label>
    <div class="sparkline-wrapper">
      <canvas class="sparkline" width="50" height="28"></canvas>
      <span class="sparkline-tooltip">${tooltipText}</span>
    </div>
    <div class="slider-container">
      <input
        type="range"
        class="slider"
        min="0"
        max="100"
        step="1"
        value="${allocation}"
      />
    </div>
    <span class="slider-value">
      <span class="percent">${allocation.toFixed(1)}%</span>
      <span class="amount">${formatCurrency(amount, symbol)}</span>
    </span>
    <span class="percentile-badge"></span>
  `;

  // Draw sparkline (only if history exists)
  const sparklineCanvas = row.querySelector(".sparkline") as HTMLCanvasElement;
  if (historyData && historyData.length > 1) {
    drawSparkline(sparklineCanvas, historyData, category.color);
  } else {
    // Hide sparkline if no data
    const sparklineWrapper = row.querySelector(".sparkline-wrapper") as HTMLElement;
    if (sparklineWrapper) {
      sparklineWrapper.style.display = "none";
    }
  }

  // Slider event listener
  const slider = row.querySelector(".slider") as HTMLInputElement;
  slider.addEventListener("input", () => {
    onSliderChange(category.id, parseFloat(slider.value));
  });

  return row;
}

export function updateSliderDisplay(
  categoryId: string,
  percent: number,
  totalBudget: number,
  symbol: string,
): void {
  const row = document.querySelector(
    `.slider-row[data-category-id="${categoryId}"]`,
  );
  if (!row) return;

  const amount = (percent / 100) * totalBudget;
  const percentEl = row.querySelector(".percent")!;
  const amountEl = row.querySelector(".amount")!;

  percentEl.textContent = `${percent.toFixed(1)}%`;
  amountEl.textContent = formatCurrency(amount, symbol);
}
