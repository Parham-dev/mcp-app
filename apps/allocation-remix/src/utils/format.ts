/**
 * Formatting utilities
 */

export function formatCurrency(amount: number, symbol: string = "$"): string {
  if (amount >= 1000) {
    return `${symbol}${Math.round(amount / 1000)}K`;
  }
  return `${symbol}${amount.toLocaleString()}`;
}

export function formatCurrencyFull(amount: number, symbol: string = "$"): string {
  return `${symbol}${amount.toLocaleString()}`;
}
