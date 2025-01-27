// src\types\error.ts
export interface AppError extends Error {
  statusCode: number;
  code?: string;
  details?: Record<string, unknown>;
}
