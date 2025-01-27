import { CategoryType } from "../components/chips/TagChip";

export const asCategoryType = (category: string): CategoryType => {
    const validCategories: CategoryType[] = [
      "MOMENT", "METHOD", "LIFESTYLE", "CONVENIENCE",
      "BUDGET", "OCCASION", "SEASONAL", "SPECIAL"
    ];
    
    return validCategories.includes(category as CategoryType)
      ? category as CategoryType
      : "MOMENT"; // Default fallback
  };