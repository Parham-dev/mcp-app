/**
 * Utility helpers
 */

/** Capitalize first letter of each word */
export function capitalize(str: string): string {
  return str.replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Emoji mapping for ingredient categories */
export const categoryEmojis: Record<string, string> = {
  protein: "🥩",
  vegetable: "🥬",
  dairy: "🧀",
  grain: "🌾",
  spice: "🌶️",
  sauce: "🫗",
  other: "🥄",
};

/** Get color for health score (red -> yellow -> green) */
export function getHealthColor(value: number): string {
  if (value <= 5) {
    // Red to Yellow: rgb(239, 68, 68) -> rgb(234, 179, 8)
    const ratio = value / 5;
    const r = Math.round(239 + (234 - 239) * ratio);
    const g = Math.round(68 + (179 - 68) * ratio);
    const b = Math.round(68 + (8 - 68) * ratio);
    return `rgb(${r}, ${g}, ${b})`;
  } else {
    // Yellow to Green: rgb(234, 179, 8) -> rgb(34, 197, 94)
    const ratio = (value - 5) / 5;
    const r = Math.round(234 + (34 - 234) * ratio);
    const g = Math.round(179 + (197 - 179) * ratio);
    const b = Math.round(8 + (94 - 8) * ratio);
    return `rgb(${r}, ${g}, ${b})`;
  }
}
