/**
 * Percentile calculation utilities
 */
import type { BenchmarkPercentiles } from "../types";

export function calculatePercentile(
  value: number,
  benchmarks: BenchmarkPercentiles,
): number {
  // Interpolate percentile based on value position relative to p25, p50, p75
  if (value <= benchmarks.p25) {
    return 25 * (value / benchmarks.p25);
  }
  if (value <= benchmarks.p50) {
    return (
      25 + 25 * ((value - benchmarks.p25) / (benchmarks.p50 - benchmarks.p25))
    );
  }
  if (value <= benchmarks.p75) {
    return (
      50 + 25 * ((value - benchmarks.p50) / (benchmarks.p75 - benchmarks.p50))
    );
  }
  // Above p75
  const extraRange = benchmarks.p75 - benchmarks.p50;
  return 75 + 25 * Math.min(1, (value - benchmarks.p75) / extraRange);
}

export function getPercentileClass(percentile: number): string {
  if (percentile >= 40 && percentile <= 60) return "percentile-normal";
  if (percentile > 60) return "percentile-high";
  return "percentile-low";
}

export function formatPercentileBadge(percentile: number): string {
  const rounded = Math.round(percentile);
  return `${rounded}th`;
}

export function getPercentileIcon(percentile: number): string {
  if (percentile >= 40 && percentile <= 60) return "";
  if (percentile > 60) return "";
  return "";
}
