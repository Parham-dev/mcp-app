import type { Recipe } from "../types/recipe";
import { HealthScoreMeter } from "./HealthScoreMeter";
import { UtensilsCrossed, Flame, Clock, iconPropsSm } from "./icons";
import styles from "../../mcp-app.module.css";

interface RecipeHeaderProps {
  recipe: Recipe;
}

export function RecipeHeader({ recipe }: RecipeHeaderProps) {
  return (
    <header className={styles.recipeHeader}>
      <h1 className={styles.recipeName}>{recipe.name}</h1>
      {recipe.description && (
        <p className={styles.recipeDescription}>{recipe.description}</p>
      )}
      
      {/* Time badges */}
      <div className={styles.timeBadges}>
        {recipe.prepTime && (
          <span className={styles.timeBadge}>
            <UtensilsCrossed {...iconPropsSm} /> Prep: {recipe.prepTime} min
          </span>
        )}
        {recipe.cookTime && (
          <span className={styles.timeBadge}>
            <Flame {...iconPropsSm} /> Cook: {recipe.cookTime} min
          </span>
        )}
        {recipe.prepTime && recipe.cookTime && (
          <span className={styles.timeBadge}>
            <Clock {...iconPropsSm} /> Total: {recipe.prepTime + recipe.cookTime} min
          </span>
        )}
      </div>

      {/* Health Score */}
      {recipe.healthScore !== undefined && (
        <HealthScoreMeter score={recipe.healthScore} />
      )}
    </header>
  );
}
