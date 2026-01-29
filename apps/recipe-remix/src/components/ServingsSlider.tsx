import { Users, iconPropsSm } from "./icons";
import styles from "../../mcp-app.module.css";

interface ServingsSliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}

export function ServingsSlider({ value, onChange, min = 1, max = 12 }: ServingsSliderProps) {
  return (
    <div className={styles.servingsSection}>
      <label className={styles.servingsLabel}>
        <span><Users {...iconPropsSm} /> Servings</span>
        <span className={styles.servingsValue}>{value}</span>
      </label>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={styles.servingsSlider}
      />
      <div className={styles.servingsRange}>
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}
