/**
 * Comparison Bar Component
 */
import type { BudgetCategory, BudgetAnalytics } from "../types";

export function updateComparisonSummary(
  comparisonSummary: HTMLElement,
  allocations: Map<string, number>,
  categories: BudgetCategory[],
  analytics: BudgetAnalytics,
  selectedStage: string,
): void {
  const stageBenchmark = analytics.benchmarks.find(
    (b) => b.stage === selectedStage,
  );
  if (!stageBenchmark) return;

  // Find most notable deviation
  let maxDeviation = 0;
  let maxDeviationCategory: BudgetCategory | null = null;
  let maxDeviationDirection = "";

  for (const category of categories) {
    const allocation = allocations.get(category.id) ?? category.defaultPercent;
    const benchmark = stageBenchmark.categoryBenchmarks[category.id];
    if (!benchmark) continue;

    const deviation = allocation - benchmark.p50;
    if (Math.abs(deviation) > Math.abs(maxDeviation)) {
      maxDeviation = deviation;
      maxDeviationCategory = category;
      maxDeviationDirection = deviation > 0 ? "above" : "below";
    }
  }

  if (maxDeviationCategory && Math.abs(maxDeviation) > 3) {
    comparisonSummary.innerHTML = `
      vs. Industry: <span class="comparison-highlight">${maxDeviationCategory.name}</span>
      ${maxDeviation > 0 ? "" : ""} ${Math.abs(Math.round(maxDeviation))}% ${maxDeviationDirection} avg
    `;
  } else {
    comparisonSummary.textContent = "vs. Industry: similar to peers";
  }
}
