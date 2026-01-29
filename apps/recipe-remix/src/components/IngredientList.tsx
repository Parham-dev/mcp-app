import type { ScaledIngredient } from "../types/recipe";
import { capitalize } from "../utils/helpers";
import { IngredientImage } from "./IngredientImage";
import { RefreshCw, iconPropsSm, iconProps, UtensilsCrossed } from "./icons";
import styles from "../../mcp-app.module.css";

interface IngredientListProps {
  ingredients: ScaledIngredient[];
  onSubstitute: (ingredientName: string) => void;
}

export function IngredientList({ ingredients, onSubstitute }: IngredientListProps) {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>
        <UtensilsCrossed {...iconProps} /> Ingredients
      </h2>
      <div className={styles.ingredientsGrid}>
        {ingredients.map((ing, idx) => (
          <div key={idx} className={styles.ingredientCard}>
            <div className={styles.ingredientImageWrapper}>
              <IngredientImage name={ing.name} category={ing.category} size="small" />
            </div>
            <div className={styles.ingredientDetails}>
              <span className={styles.ingredientName}>{capitalize(ing.name)}</span>
              <span className={styles.ingredientAmount}>
                {ing.scaledAmount} {ing.unit}
              </span>
            </div>
            <button
              className={styles.ingredientAction}
              onClick={() => onSubstitute(ing.name)}
              title="Ask AI for substitute"
            >
              <RefreshCw {...iconPropsSm} />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
