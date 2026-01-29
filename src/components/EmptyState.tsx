import styles from "../mcp-app.module.css";

export function EmptyState() {
  return (
    <div className={styles.container}>
      <div className={styles.emptyState}>
        <span className={styles.emptyIcon}>🍳</span>
        <h2 className={styles.emptyTitle}>Recipe Remix</h2>
        <p className={styles.emptyText}>
          Ask the AI for a recipe and it will appear here with an interactive UI!
        </p>
        <p className={styles.emptyHint}>
          Try: "How do I make spaghetti carbonara?"
        </p>
      </div>
    </div>
  );
}
