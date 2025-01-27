// src/types/recipe.ts
export interface RecipeCard {
    id: string;
    title: string;
    mainImage: string | null;
    description: string;
    costPerServing: number;
    difficulty: number;
    totalTime: number;
  }
  
export   interface RecipeCardResponse {
    recipe: RecipeCard;
  }

  export interface Tag {
    name: string;
    category: string;
  }

  export interface Recipe {
    id: string;
    title: string;
    mainImage: string;
    subtitle?: string;
    costPerServing: number;
    difficulty: number;
    totalTime: number;
    tags?: Tag[];
  }

 export  interface RecipeSection {
    title: string;
    recipes: Recipe[] | undefined;
    loading: boolean;
    error?: Error;
  }

  export interface RecipeHistoryEntry {
    recipe: Recipe;
    viewedAt: string;
    viewDuration: number;
  }
  
  export interface RecipeHistoryData {
    recentlyViewedRecipes: RecipeHistoryEntry[];
  }


  export interface UseRecipeListProps {
    limit?: number;
    offset?: number;
    tags?: string[];
    difficulty?: number;
    query?: string;
  }