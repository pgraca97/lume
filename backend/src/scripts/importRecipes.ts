// src/scripts/importRecipes.ts
import mongoose, { Error as MongooseError, Types } from 'mongoose';
import { Recipe } from '../models/Recipe';
import { Ingredient } from '../models/Ingredient';
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';
import { DifficultyLevel } from '../models/enums/RecipeEnums';

dotenv.config();

interface MongooseValidationError extends Error {
  errors: { [key: string]: { message: string } };
}

async function validateIngredients(recipe: any, index: number) {
  const existingIngredients = new Set(
    (await Ingredient.find({}, '_id')).map(ing => ing._id.toString())
  );
  
  if (!recipe.ingredients || !Array.isArray(recipe.ingredients)) {
    throw new Error(`Recipe at index ${index} has invalid ingredients format`);
  }
  
  // Validate basic ingredients array
  if (recipe.ingredients.length < 1 || recipe.ingredients.length > 30) {
    throw new Error(`Recipe at index ${index} ingredients count must be between 1 and 30`);
  }
  
  // Convert servingSuggestions to ingredients if present
  if (recipe.servingSuggestions?.suggestedIngredients) {
    const additionalIngredients = recipe.servingSuggestions.suggestedIngredients.map((suggestion: any) => ({
      ingredientName: suggestion.name,
      amount: suggestion.amount || 1,
      unit: suggestion.unit || 'serving',
      notes: suggestion.notes,
      type: 'TOPPING',
      importance: suggestion.category === 'ESSENTIAL' ? 'RECOMMENDED' : 'OPTIONAL'
    }));
    
    recipe.ingredients = [...recipe.ingredients, ...additionalIngredients];
    
    // Move description to servingInstructions if present
    if (recipe.servingSuggestions.description) {
      recipe.servingInstructions = recipe.servingSuggestions.description;
    }
    
    delete recipe.servingSuggestions;
  }
  
  // Ensure all ingredients have type and importance
  recipe.ingredients = recipe.ingredients.map((ing: any) => ({
    ...ing,
    type: ing.type || 'CORE',
    importance: ing.importance || 'REQUIRED'
  }));
  
  // Check for at least one CORE + REQUIRED ingredient
  const hasCoreRequired = recipe.ingredients.some((ing: any) => 
    ing.type === 'CORE' && ing.importance === 'REQUIRED'
);

if (!hasCoreRequired) {
  throw new Error(`Recipe at index ${index} must have at least one CORE + REQUIRED ingredient`);
}

// Validate each ingredient
recipe.ingredients.forEach((ingredient: any, ingredientIndex: number) => {
  if (ingredient.ingredient && !existingIngredients.has(ingredient.ingredient.toString())) {
    throw new Error(`Invalid ingredient reference at index ${ingredientIndex} in recipe ${index}`);
  }
  
  if ((!ingredient.ingredient && !ingredient.ingredientName) || 
  (ingredient.ingredient && ingredient.ingredientName)) {
    throw new Error(`Ingredient must have either reference or name at index ${ingredientIndex} in recipe ${index}`);
  }
  
  if (!ingredient.amount || typeof ingredient.amount !== 'number' || ingredient.amount <= 0) {
    throw new Error(`Invalid amount at index ${ingredientIndex} in recipe ${index}`);
  }
  
  if (!ingredient.unit || typeof ingredient.unit !== 'string') {
    throw new Error(`Invalid unit at index ${ingredientIndex} in recipe ${index}`);
  }
  
  // Validate substitutes
  if (ingredient.suggestedSubstitutes?.length > 0) {
    if (ingredient.suggestedSubstitutes.length > 5) {
      throw new Error(`Too many substitutes (max 5) at index ${ingredientIndex} in recipe ${index}`);
    }
    
    ingredient.suggestedSubstitutes.forEach((sub: any) => {
      // Verifica se tem ingredient ou ingredientName
      if (!sub.ingredient && !sub.ingredientName) {
        throw new Error(`Substitute must have either ingredient or ingredientName at index ${ingredientIndex} in recipe ${index}`);
      }
      
      // Valida referência apenas se ingredient estiver presente
      if (sub.ingredient && !existingIngredients.has(sub.ingredient.toString())) {
        throw new Error(`Invalid ingredient reference for substitute at index ${ingredientIndex} in recipe ${index}`);
      }
    });
  }
});
}

async function importRecipes() {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log('Connected to MongoDB');
    
    const recipesRaw = await fs.readFile(
      path.join(__dirname, '../../data/recipes.json'),
      'utf-8'
    );
    
    let recipes = JSON.parse(recipesRaw);
    if (!Array.isArray(recipes)) {
      recipes = recipes.recipes || [recipes];
    }
    
    console.log(`Found ${recipes.length} recipes to import`);
    
    // Validate all recipes
    for (let index = 0; index < recipes.length; index++) {
      const recipe = recipes[index];
      
      // Check required fields
      const requiredFields = [
        'title', 'description', 'mainImage', 'difficulty', 
        'prepTime', 'cookTime', 'servings', 'ingredients', 
        'steps', 'tags', 'nutritionPerServing', 'costPerServing'
      ];
      
      // Using nullish coalescing
      const missingFields = requiredFields.filter(field => (recipe[field] ?? null) === null);
      if (missingFields.length > 0) {
        throw new Error(`Recipe ${recipe.title} is missing: ${missingFields.join(', ')}`);
      }
      
      if (!Object.values(DifficultyLevel).includes(recipe.difficulty)) {
        throw new Error(`Recipe ${recipe.title} has invalid difficulty level`);
      }
      
      await validateIngredients(recipe, index);
    }
    
    // Clear existing and import new
    await Recipe.deleteMany({});
    const importedRecipes = await Recipe.insertMany(recipes, { ordered: false });
    console.log(`Successfully imported ${importedRecipes.length} recipes`);
    
    return importedRecipes;
  } catch (error) {
    console.error('Import failed:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
  }
}

if (require.main === module) {
  importRecipes()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
}

export { importRecipes };