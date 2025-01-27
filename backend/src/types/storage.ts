// src\types\storage.ts

export type StoragePath = 
  | 'recipes/main'      // For recipe main images
  | 'recipes/steps'     // For step videos/images
  | 'recipes/gallery'   // For additional recipe images
  | 'ingredients/main'  // For ingredient images
  | 'profileImages'     // For user profile pictures
  | 'users/cooksnaps';  // For user-submitted cooking photos

export interface StorageConfig {
    accountName: string;
    containerName: string;
    sasToken: string;
  }
