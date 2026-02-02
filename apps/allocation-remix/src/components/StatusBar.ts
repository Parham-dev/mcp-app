/**
 * Status Bar Component
 */
import { formatCurrencyFull } from "../utils";

export function updateStatusBar(
  statusBar: HTMLElement,
  allocations: Map<string, number>,
  totalBudget: number,
  currencySymbol: string,
): void {
  const total = Array.from(allocations.values()).reduce((sum, v) => sum + v, 0);
  const allocated = (total / 100) * totalBudget;
  const isBalanced = Math.abs(total - 100) < 0.1;

  let statusIcon: string;
  let statusClass: string;

  if (isBalanced) {
    statusIcon = "";
    statusClass = "status-balanced";
  } else if (total > 100) {
    statusIcon = " Over";
    statusClass = "status-warning status-over";
  } else {
    statusIcon = " Under";
    statusClass = "status-warning status-under";
  }

  statusBar.innerHTML = `
    Allocated: ${formatCurrencyFull(allocated, currencySymbol)} / ${formatCurrencyFull(totalBudget, currencySymbol)}
    <span class="status-icon">${statusIcon}</span>
  `;
  statusBar.className = `status-bar ${statusClass}`;
}
