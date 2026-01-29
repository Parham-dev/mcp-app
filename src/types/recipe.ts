/**
 * Recipe types - shared across components
 */

export interface Ingredient {
  name: string;
  amount: number;
  unit: string;
  category?: "protein" | "vegetable" | "dairy" | "grain" | "spice" | "sauce" | "other";
}

export interface ScaledIngredient extends Ingredient {
  scaledAmount: number;
}

export interface Step {
  instruction: string;
  duration?: number;
}

export interface Recipe {
  name: string;
  description?: string;
  servings: number;
  prepTime?: number;
  cookTime?: number;
  ingredients: Ingredient[];
  steps: Step[];
  notes?: string;
  healthScore?: number; // 0-10 health rating from AI
}
