import type { Step } from "../types/recipe";
import styles from "../mcp-app.module.css";

interface StepsListProps {
  steps: Step[];
  onExplain: (instruction: string) => void;
}

export function StepsList({ steps, onExplain }: StepsListProps) {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>👨‍🍳 Steps</h2>
      <ol className={styles.stepsList}>
        {steps.map((step, idx) => (
          <li key={idx} className={styles.stepItem}>
            <span className={styles.stepNumber}>{idx + 1}</span>
            <div className={styles.stepContent}>
              <p className={styles.stepInstruction}>{step.instruction}</p>
              {step.duration && (
                <span className={styles.stepDuration}>⏱️ {step.duration} min</span>
              )}
            </div>
            <button
              className={styles.stepAction}
              onClick={() => onExplain(step.instruction)}
              title="Ask AI to explain"
            >
              ❓
            </button>
          </li>
        ))}
      </ol>
    </section>
  );
}
