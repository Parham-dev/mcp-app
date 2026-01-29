import type { ScaledIngredient } from "../types/recipe";
import { capitalize } from "../utils/helpers";
import { getCategoryIcon } from "../utils/categoryIcons";
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
      <ul className={styles.ingredientsList}>
        {ingredients.map((ing, idx) => (
          <li key={idx} className={styles.ingredientItem}>
            <span className={styles.ingredientIcon}>
              {getCategoryIcon(ing.category)}
            </span>
            <span className={styles.ingredientAmount}>
              {ing.scaledAmount} {ing.unit}
            </span>
            <span className={styles.ingredientName}>{capitalize(ing.name)}</span>
            <button
              className={styles.ingredientAction}
              onClick={() => onSubstitute(ing.name)}
              title="Ask AI for substitute"
            >
              <RefreshCw {...iconPropsSm} />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
