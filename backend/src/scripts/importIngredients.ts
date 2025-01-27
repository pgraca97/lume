// src/scripts/importIngredients.ts
import mongoose, { Document, Types } from 'mongoose';
import { Ingredient, IIngredient } from '../models/Ingredient';
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

interface IngredientInput {
  name: string;
  slug?: string;
  alternateNames: string[];
  image?: string;
  category: string;
  isGeneric: boolean;
  specificType?: string;
  parentIngredient?: string;
  defaultUnit: string;
  validUnits: string[];
  nutritionPer100g?: {
    calories: number;
    protein: number;
    carbohydrates: number;
    fat: number;
    fiber?: number;
    sugar?: number;
    sodium?: number;
  };
  storage?: string;
  seasonality?: string[];
}

interface ImportData {
  ingredients: IngredientInput[];
}

type IngredientDocument = Document<unknown, {}, IIngredient> & 
  IIngredient & 
  Required<{ _id: Types.ObjectId }>;

function validateBasicFields(ingredient: IngredientInput, index: number) {
  const requiredFields = ['name', 'category', 'defaultUnit', 'validUnits'];
  for (const field of requiredFields) {
    if (!ingredient[field as keyof IngredientInput]) {
      throw new Error(`Ingredient at index ${index} is missing required field: ${field}`);
    }
  }

  if (!Array.isArray(ingredient.validUnits) || ingredient.validUnits.length === 0) {
    throw new Error(`Ingredient ${ingredient.name} must have at least one valid unit`);
  }

  if (!ingredient.defaultUnit || !ingredient.validUnits.includes(ingredient.defaultUnit)) {
    throw new Error(`Ingredient ${ingredient.name}'s defaultUnit must be one of its validUnits`);
  }
}

async function importIngredients() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log('MongoDB connected successfully');

    // Read ingredients file
    console.log('Reading ingredients data file...');
    const ingredientsRaw = await fs.readFile(
      path.join(__dirname, '../../data/ingredients.json'),
      'utf-8'
    );
    const { ingredients } = JSON.parse(ingredientsRaw) as ImportData;
    console.log(`Found ${ingredients.length} ingredients to import`);

    // Clear existing data
    await Ingredient.deleteMany({});

    // First validate basic fields
    ingredients.forEach((ingredient, index) => {
      validateBasicFields(ingredient, index);
    });

   // Organizar ingredientes em níveis hierárquicos
   const ingredientLevels: IngredientInput[][] = [];
   const remainingIngredients = [...ingredients];
   const processedNames = new Set<string>();
   
   // Nível 0: Apenas ingredientes genéricos sem parent
   ingredientLevels[0] = remainingIngredients.filter(ing => 
     ing.isGeneric && !ing.parentIngredient
   );
   
   console.log('\nLevel 0 (Root Generic Ingredients):');
   console.log(ingredientLevels[0].map(ing => ing.name).join(', '));
   
   // Adiciona os nomes ao conjunto de processados
   ingredientLevels[0].forEach(ing => processedNames.add(ing.name.toLowerCase()));
   
   // Remove os ingredientes processados
   let processedIndices = remainingIngredients
     .map((ing, index) => ingredientLevels[0].includes(ing) ? index : -1)
     .filter(index => index !== -1)
     .sort((a, b) => b - a);
   
   processedIndices.forEach(index => {
     remainingIngredients.splice(index, 1);
   });

   // Nível 1: Ingredientes genéricos com parent
   ingredientLevels[1] = remainingIngredients.filter(ing => 
     ing.isGeneric && ing.parentIngredient && 
     processedNames.has(ing.parentIngredient.toLowerCase())
   );
   
   console.log('\nLevel 1 (Generic Ingredients with Parents):');
   console.log(ingredientLevels[1].map(ing => ing.name).join(', '));
   
   ingredientLevels[1].forEach(ing => processedNames.add(ing.name.toLowerCase()));
   
   // Remove os ingredientes processados
   processedIndices = remainingIngredients
     .map((ing, index) => ingredientLevels[1].includes(ing) ? index : -1)
     .filter(index => index !== -1)
     .sort((a, b) => b - a);
   
   processedIndices.forEach(index => {
     remainingIngredients.splice(index, 1);
   });

   // Processa os níveis restantes (variantes não genéricas)
   let level = 2;
   while (remainingIngredients.length > 0) {
     const currentLevelIngredients = remainingIngredients.filter(ing => 
       ing.parentIngredient && processedNames.has(ing.parentIngredient.toLowerCase())
     );

     if (currentLevelIngredients.length === 0) {
       const remaining = remainingIngredients
         .map(ing => `${ing.name} (parent: ${ing.parentIngredient || 'undefined'})`)
         .join(', ');
       throw new Error(`Unable to resolve dependencies for remaining ingredients: ${remaining}`);
     }

     ingredientLevels[level] = currentLevelIngredients;
     console.log(`\nLevel ${level} (Variants):`);
     console.log(currentLevelIngredients.map(ing => ing.name).join(', '));
     
     currentLevelIngredients.forEach(ing => processedNames.add(ing.name.toLowerCase()));
     
     processedIndices = remainingIngredients
       .map((ing, index) => currentLevelIngredients.includes(ing) ? index : -1)
       .filter(index => index !== -1)
       .sort((a, b) => b - a);
     
     processedIndices.forEach(index => {
       remainingIngredients.splice(index, 1);
     });
     
     level++;
   }

    console.log('\nIngredient hierarchy levels:');
    ingredientLevels.forEach((level, index) => {
      console.log(`Level ${index}:`, level.map(ing => ing.name).join(', '));
    });

    // Criar ingredientes nível por nível
    const nameToId = new Map<string, Types.ObjectId>();
    const createdIngredients: IngredientDocument[] = [];
    
    for (let level = 0; level < ingredientLevels.length; level++) {
      console.log(`\nCreating level ${level} ingredients...`);
      const levelIngredients = ingredientLevels[level];
      
      const created = await Promise.all(
        levelIngredients.map(async (ingredient: IngredientInput) => {
          const parentId = ingredient.parentIngredient ? 
            nameToId.get(ingredient.parentIngredient.toLowerCase()) : undefined;

          if (ingredient.parentIngredient && !parentId) {
            throw new Error(`Parent ingredient "${ingredient.parentIngredient}" not found for "${ingredient.name}"`);
          }

          const created = await Ingredient.create({
            ...ingredient,
            parentIngredient: parentId,
            variants: [],
            slug: ingredient.slug || ingredient.name.toLowerCase().replace(/\s+/g, '-')
          });
          return created as IngredientDocument;
        })
      );

      // Atualizar o mapa de nomes para IDs
      created.forEach((ing: IngredientDocument) => {
        nameToId.set(ing.name.toLowerCase(), ing._id);
        ing.alternateNames.forEach((alt: string) => {
          nameToId.set(alt.toLowerCase(), ing._id);
        });
      });

      createdIngredients.push(...created);
    }

    // Atualizar variants
    console.log('\nUpdating variant relationships...');
    for (const ingredient of createdIngredients) {
      const variantIds = createdIngredients
        .filter(v => v.parentIngredient && v.parentIngredient.equals(ingredient._id))
        .map(v => v._id);

      if (variantIds.length > 0) {
        await Ingredient.findByIdAndUpdate(ingredient._id, {
          variants: variantIds
        });
      }
    }

    const genericCount = createdIngredients.filter(ing => ing.isGeneric).length;
    const variantCount = createdIngredients.length - genericCount;

    console.log(`\nImport completed successfully!`);
    console.log(`Created ${genericCount} generic ingredients`);
    console.log(`Created ${variantCount} variant ingredients`);
    console.log(`Total: ${createdIngredients.length} ingredients`);

    return createdIngredients;
  } catch (error) {
    console.error('Error importing ingredients:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Run the import
if (require.main === module) {
  importIngredients()
    .then(() => {
      console.log('Import completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('Import failed:', error);
      process.exit(1);
    });
}

export { importIngredients };