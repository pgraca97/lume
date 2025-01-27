// src/utils/errors.ts
import { AppError } from '../types/error';

export class ApplicationError extends Error {
  constructor(
      message: string,
      public statusCode: number,
      public details?: {
          code?: string;
          [key: string]: unknown;
      }
  ) {
      super(message);
      this.name = 'ApplicationError';
  }
}