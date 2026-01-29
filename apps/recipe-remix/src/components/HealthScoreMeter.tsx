import { getHealthColor } from "../utils/helpers";
import { Heart, Scale, Salad, iconPropsSm } from "./icons";
import styles from "../../mcp-app.module.css";

interface HealthScoreMeterProps {
  score: number;
}

// Get health icon based on score
function getHealthIcon(score: number) {
  if (score <= 3) return <Heart {...iconPropsSm} />;
  if (score <= 6) return <Scale {...iconPropsSm} />;
  return <Salad {...iconPropsSm} />;
}

export function HealthScoreMeter({ score }: HealthScoreMeterProps) {
  // Clamp score between 0-10
  const clampedScore = Math.max(0, Math.min(10, score));
  const percentage = clampedScore * 10;
  const color = getHealthColor(clampedScore);
  
  const label = clampedScore <= 3 ? "Indulgent" : clampedScore <= 6 ? "Balanced" : "Healthy";

  return (
    <div className={styles.healthMeter}>
      <div className={styles.healthHeader}>
        <span className={styles.healthLabel}>{getHealthIcon(clampedScore)} Health Score</span>
        <span className={styles.healthValue} style={{ color }}>
          {clampedScore.toFixed(1)}/10
        </span>
      </div>
      <div className={styles.healthBarContainer}>
        <div 
          className={styles.healthBar} 
          style={{ width: `${percentage}%`, backgroundColor: color }}
        />
      </div>
      <div className={styles.healthDescription}>{label}</div>
    </div>
  );
}
