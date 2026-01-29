/**
 * Category icons for ingredients
 * Maps ingredient categories to Lucide icons
 */
import type { ReactNode } from "react";
import { Beef, Carrot, Milk, Wheat, Sparkles, Droplets, CircleDot } from "lucide-react";

const iconProps = { size: 18, strokeWidth: 2 };

// Map categories to icon components
const categoryIconMap: Record<string, ReactNode> = {
  protein: <Beef {...iconProps} />,
  vegetable: <Carrot {...iconProps} />,
  dairy: <Milk {...iconProps} />,
  grain: <Wheat {...iconProps} />,
  spice: <Sparkles {...iconProps} />,
  sauce: <Droplets {...iconProps} />,
  other: <CircleDot {...iconProps} />,
};

export function getCategoryIcon(category: string | undefined): ReactNode {
  return categoryIconMap[category || "other"] || categoryIconMap.other;
}
