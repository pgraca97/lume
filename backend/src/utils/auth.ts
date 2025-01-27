// backend\src\utils\auth.ts
import { ApplicationError } from './errors';
import { Context } from '../types/context';

/**
 * Protect resolver by checking if user is authenticated
 * @param context GraphQL context containing user info
 * @throws {ApplicationError} If user is not authenticated
 */
export function requireAuth(context: Context) {
  if (!context.user?.uid) {
    throw new ApplicationError('Not authenticated', 401);
  }
  return context.user;
}

/**
 * Check if user has admin role
 * @param context GraphQL context containing user info
 * @throws {ApplicationError} If user is not admin
 */
export function requireAdmin(context: Context) {
  const user = requireAuth(context);
  // TODO: Implement admin check logic
  // For now just checking if email contains 'admin'
  if (!user.email?.includes('admin')) {
    throw new ApplicationError('Not authorized. Admin access required', 403);
  }
  return user;
}