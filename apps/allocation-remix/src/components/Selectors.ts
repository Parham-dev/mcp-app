/**
 * Selectors Component
 */
import { formatCurrencyFull } from "../utils";

export function initBudgetSelector(
  selector: HTMLSelectElement,
  presets: number[],
  defaultBudget: number,
  currencySymbol: string,
  onChange: (newBudget: number) => void,
): void {
  selector.innerHTML = "";

  for (const amount of presets) {
    const option = document.createElement("option");
    option.value = amount.toString();
    option.textContent = formatCurrencyFull(amount, currencySymbol);
    option.selected = amount === defaultBudget;
    selector.appendChild(option);
  }

  selector.addEventListener("change", () => {
    onChange(parseInt(selector.value));
  });
}

export function initStageSelector(
  selector: HTMLSelectElement,
  stages: string[],
  defaultStage: string,
  onChange: (newStage: string) => void,
): void {
  selector.innerHTML = "";

  for (const stage of stages) {
    const option = document.createElement("option");
    option.value = stage;
    option.textContent = stage;
    option.selected = stage === defaultStage;
    selector.appendChild(option);
  }

  selector.addEventListener("change", () => {
    onChange(selector.value);
  });
}
