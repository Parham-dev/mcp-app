/**
 * Ingredient image component with TheMealDB integration
 * Falls back to Lucide icon if image fails to load
 */
import { useState } from "react";
import { getCategoryIcon } from "../utils/categoryIcons";

interface IngredientImageProps {
  name: string;
  category?: string;
  size?: "small" | "medium";
}

// Common name mappings to match TheMealDB naming
const nameMapping: Record<string, string> = {
  // Proteins
  "guanciale": "Pancetta",
  "pancetta": "Pancetta",
  "bacon": "Bacon",
  "chicken breast": "Chicken Breast",
  "chicken": "Chicken",
  "beef": "Beef",
  "pork": "Pork",
  "salmon": "Salmon",
  "shrimp": "Prawns",
  "prawns": "Prawns",
  
  // Eggs
  "egg yolks": "Eggs",
  "whole eggs": "Eggs",
  "eggs": "Eggs",
  "egg": "Eggs",
  
  // Dairy
  "pecorino romano": "Parmesan Cheese",
  "pecorino": "Parmesan Cheese",
  "parmesan": "Parmesan Cheese",
  "parmesan cheese": "Parmesan Cheese",
  "parmigiano": "Parmesan Cheese",
  "cream": "Double Cream",
  "heavy cream": "Double Cream",
  "butter": "Butter",
  "milk": "Milk",
  "mozzarella": "Mozzarella",
  
  // Pasta & Grains
  "spaghetti": "Spaghetti",
  "pasta": "Pasta",
  "penne": "Penne",
  "rice": "Rice",
  "bread": "Bread",
  
  // Vegetables
  "onion": "Onion",
  "onions": "Onion",
  "garlic": "Garlic",
  "garlic cloves": "Garlic",
  "tomatoes": "Tomatoes",
  "tomato": "Tomatoes",
  "carrots": "Carrots",
  "carrot": "Carrots",
  "celery": "Celery",
  "potato": "Potatoes",
  "potatoes": "Potatoes",
  
  // Oils & Sauces
  "olive oil": "Olive Oil",
  "extra virgin olive oil": "Olive Oil",
  "vegetable oil": "Vegetable Oil",
  "soy sauce": "Soy Sauce",
  
  // Spices & Seasonings
  "black pepper": "Black Pepper",
  "pepper": "Black Pepper",
  "salt": "Salt",
  "sea salt": "Salt",
  "kosher salt": "Salt",
  "paprika": "Paprika",
  "cumin": "Cumin",
  "oregano": "Oregano",
  "basil": "Basil",
  "thyme": "Thyme",
  "rosemary": "Rosemary",
};

// Clean ingredient name - remove parentheses, descriptors, etc.
function cleanIngredientName(name: string): string {
  return name
    .toLowerCase()
    // Remove parenthetical content like "(or pancetta)" or "(grated)"
    .replace(/\s*\([^)]*\)/g, "")
    // Remove common descriptors
    .replace(/\b(freshly|fresh|ground|grated|chopped|diced|minced|sliced|dried|frozen|canned|organic)\b/gi, "")
    // Remove "cheese" if it follows a specific cheese name
    .replace(/\b(romano|parmesan|pecorino|cheddar|mozzarella)\s+cheese\b/gi, "$1")
    // Clean up whitespace
    .replace(/\s+/g, " ")
    .trim();
}

// Generate TheMealDB image URL from ingredient name
function getIngredientImageUrl(name: string, size: "small" | "medium" = "small"): string {
  // Clean and normalize the name
  const cleanedName = cleanIngredientName(name);
  
  // Check mapping first
  const mapped = nameMapping[cleanedName];
  
  // Use mapped name or capitalize the cleaned name
  const normalized = mapped || cleanedName
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
  
  const encoded = encodeURIComponent(normalized);
  const suffix = size === "small" ? "-Small" : "";
  
  // Direct TheMealDB URL - CSP resourceDomains allows this
  return `https://www.themealdb.com/images/ingredients/${encoded}${suffix}.png`;
}

export function IngredientImage({ name, category, size = "small" }: IngredientImageProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const imageUrl = getIngredientImageUrl(name, size);

  if (hasError) {
    // Fallback to category icon - show URL for debugging
    return (
      <div className="ingredient-image-fallback" title={`Failed: ${imageUrl} - ${errorMsg}`}>
        {getCategoryIcon(category)}
      </div>
    );
  }

  return (
    <div className={`ingredient-image-container ${isLoading ? "loading" : ""}`}>
      <img
        src={imageUrl}
        alt={name}
        onLoad={() => {
          setIsLoading(false);
        }}
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          setErrorMsg(target.src || "unknown");
          setHasError(true);
          setIsLoading(false);
        }}
        loading="lazy"
      />
    </div>
  );
}
