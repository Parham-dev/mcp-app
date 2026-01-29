import type { ScaledIngredient } from "../types/recipe";
import { capitalize, categoryEmojis } from "../utils/helpers";
import styles from "../../mcp-app.module.css";

interface IngredientListProps {
  ingredients: ScaledIngredient[];
  onSubstitute: (ingredientName: string) => void;
}

export function IngredientList({ ingredients, onSubstitute }: IngredientListProps) {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>🥘 Ingredients</h2>
      <ul className={styles.ingredientsList}>
        {ingredients.map((ing, idx) => (
          <li key={idx} className={styles.ingredientItem}>
            <span className={styles.ingredientEmoji}>
              {categoryEmojis[ing.category || "other"]}
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
              🔄
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
