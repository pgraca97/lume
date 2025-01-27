interface RecipeProps {
  id: string;
  title: string;
  servings: number;
  ingredients: Array<{
    amount: number;
    unit: string;
    notes?: string;
    type: "CORE" | "TOPPING" | "GARNISH";
    importance: "REQUIRED" | "RECOMMENDED" | "OPTIONAL";
    ingredientName?: string;
    ingredient?: {
      id: string;
      name: string;
      category: string;
      nutritionPer100g?: {
        calories: number;
        protein: number;
        carbohydrates: number;
        fat: number;
      };
    };
    suggestedSubstitutes?: Array<{
      ingredientName?: string;
      notes?: string;
      conversion?: string;
      ingredient?: {
        id: string;
        name: string;
        category: string;
      };
    }>;
  }>;
}
