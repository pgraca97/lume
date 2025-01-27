// src/config/azureStorage.ts
import { BlobServiceClient } from "@azure/storage-blob";
import { StorageConfig, StoragePath } from "../types/storage";
import { ApplicationError } from "../utils/errors";
import dotenv from "dotenv";

// Ensure environment variables are loaded
dotenv.config();

interface RecipeStep {
  order: number;
  description: string;
  tips?: string;
  image?: string;
  video?: string;
}

interface Recipe {
  mainImage?: string;
  images?: string[];
  steps?: RecipeStep[];
}

class AzureStorageService {
  private config: StorageConfig;
  private blobServiceClient: BlobServiceClient;

  constructor() {
    const accountName = process.env.ACCOUNT_NAME;
    const containerName = process.env.CONTAINER_NAME;
    const sasToken = process.env.SAS_TOKEN;

    if (!accountName || !containerName || !sasToken) {
      throw new ApplicationError(
        'Azure Storage configuration missing', 
        500,
        {
          accountName: !!accountName,
          containerName: !!containerName,
          sasToken: !!sasToken
        }
      );
    }

    this.config = {
      accountName,
      containerName,
      sasToken,
    };

    this.blobServiceClient = new BlobServiceClient(
      `https://${this.config.accountName}.blob.core.windows.net/?${this.config.sasToken}`
    );
  }

  private getContainerFromPath(path: string): string {
    if (path.startsWith('avatars/') ) {
      return 'defaults';
    } else if (path.startsWith('profileImages')) return 'users';
    else if (path.startsWith('badges/')) return '';
    return this.config.containerName; // Default to recipeimages
  }

  getSecureUrl(path: string): string {
    if (!path) return '';
    
    const container = this.getContainerFromPath(path);
    
    if (path.startsWith('http')) {
      path = this.extractRelativePath(path);
    }
    if (container === '') { return `https://${this.config.accountName}.blob.core.windows.net/${path}?${this.config.sasToken}` }
    return `https://${this.config.accountName}.blob.core.windows.net/${container}/${path}?${this.config.sasToken}`;
  }

  generateStoragePath(
    originalName: string, 
    pathType: StoragePath,
    identifier?: string
  ): string {
    const timestamp = new Date().getTime();
    const extension = originalName.split('.').pop()?.toLowerCase() || '';
    const randomString = Math.random().toString(36).substring(2, 6); // 4 random characters
    
    // Remove extension and special characters from the original name
    const sanitizedName = originalName
      .replace(`.${extension}`, '')
      .replace(/[^a-z0-9]/gi, '-')
      .toLowerCase();
    if (identifier) {
      return `${pathType}/${identifier}-${timestamp}-${sanitizedName}-${randomString}.${extension}`;
    }
    
    return `${pathType}/${timestamp}-${sanitizedName}-${randomString}.${extension}`;
  }

  private extractRelativePath(url: string): string {
    try {
      if (!url.startsWith('http')) return url;
      
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      // Remove empty parts and container name
      return pathParts
        .filter(part => part && part !== this.config.containerName)
        .join('/');
    } catch {
      return url;
    }
  }

  processRecipeImages(recipe: Recipe): Recipe {
    const processed = { ...recipe };

    if (processed.mainImage) {
      processed.mainImage = this.getSecureUrl(processed.mainImage);
    }

    if (Array.isArray(processed.images)) {
      processed.images = processed.images.map(img => 
        this.getSecureUrl(img)
      );
    }

    if (Array.isArray(processed.steps)) {
      processed.steps = processed.steps.map(step => ({
        ...step,
        image: step.image ? this.getSecureUrl(step.image) : undefined,
        video: step.video ? this.getSecureUrl(step.video) : undefined
      }));
    }

    return processed;
  }

  async deleteBlob(blobPath: string): Promise<void> {
    try {
      // Clean the path it it's a full URL
      if (blobPath.startsWith('http')) {
        blobPath = this.extractRelativePath(blobPath);
      }

      const containerClient = this.blobServiceClient.getContainerClient(this.config.containerName);

      const blobClient = containerClient.getBlobClient(blobPath);

      // Check if blob exists first
      const exists = await blobClient.exists();
      if (!exists) {
        throw new ApplicationError(`Blob ${blobPath} not found`, 404);
      }

      await blobClient.delete();
    } catch (error) {
      console.error('Error deleting blob:', error);
      throw new ApplicationError(
        'Failed to delete image',
        (error as { statusCode?: number }).statusCode || 500
        
      );
    }
  }
}

// Create and export a single instance
export const azureStorage = new AzureStorageService();
