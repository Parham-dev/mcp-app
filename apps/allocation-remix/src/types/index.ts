/**
 * Type definitions for Budget Allocator app
 */

export interface BudgetCategory {
  id: string;
  name: string;
  color: string;
  defaultPercent: number;
}

export interface BenchmarkPercentiles {
  p25: number;
  p50: number;
  p75: number;
}

export interface StageBenchmark {
  stage: string;
  categoryBenchmarks: Record<string, BenchmarkPercentiles>;
}

export interface BudgetConfig {
  categories: BudgetCategory[];
  presetBudgets: number[];
  defaultBudget: number;
  currency: string;
  currencySymbol: string;
  title?: string;
}

export interface HistoricalMonth {
  month: string;
  allocations: Record<string, number>;
}

export interface BudgetAnalytics {
  history: HistoricalMonth[];
  benchmarks: StageBenchmark[];
  stages: string[];
  defaultStage: string;
}

export interface BudgetDataResponse {
  config: BudgetConfig;
  analytics: BudgetAnalytics;
}

export interface AppState {
  config: BudgetConfig | null;
  analytics: BudgetAnalytics | null;
  totalBudget: number;
  allocations: Map<string, number>;
  selectedStage: string;
  chart: import("chart.js").Chart<"doughnut"> | null;
}
