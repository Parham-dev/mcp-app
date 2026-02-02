/**
 * Percentile Badge Component
 */
import type { BudgetCategory, BudgetAnalytics } from "../types";
import {
  calculatePercentile,
  getPercentileClass,
  formatPercentileBadge,
  getPercentileIcon,
} from "../utils";

export function updatePercentileBadge(
  categoryId: string,
  categories: BudgetCategory[],
  allocations: Map<string, number>,
  analytics: BudgetAnalytics,
  selectedStage: string,
): void {
  // Return early if no benchmarks available
  if (!analytics.benchmarks || analytics.benchmarks.length === 0) return;
  
  const stageBenchmark = analytics.benchmarks.find(
    (b) => b.stage === selectedStage,
  );
  if (!stageBenchmark) return;

  const category = categories.find((c) => c.id === categoryId);
  if (!category) return;

  const currentAllocation =
    allocations.get(categoryId) ?? category.defaultPercent;
  const benchmarks = stageBenchmark.categoryBenchmarks[categoryId];
  if (!benchmarks) return;

  const badge = document.querySelector(
    `.slider-row[data-category-id="${categoryId}"] .percentile-badge`,
  );
  if (!badge) return;

  const percentile = calculatePercentile(currentAllocation, benchmarks);
  badge.className = `percentile-badge ${getPercentileClass(percentile)}`;
  badge.innerHTML = `<span class="percentile-icon">${getPercentileIcon(percentile)}</span>${formatPercentileBadge(percentile)}`;
}

export function updateAllPercentileBadges(
  categories: BudgetCategory[],
  allocations: Map<string, number>,
  analytics: BudgetAnalytics,
  selectedStage: string,
): void {
  for (const category of categories) {
    updatePercentileBadge(category.id, categories, allocations, analytics, selectedStage);
  }
}
