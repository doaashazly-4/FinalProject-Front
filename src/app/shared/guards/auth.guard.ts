import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard to protect routes that require authentication
 * Redirects to login if not authenticated
 */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  
  if (!auth.isAuthenticated()) {
    router.navigate(['/login']);
    return false;
  }
  
  return true;
};

/**
 * Guard to prevent authenticated users from accessing auth pages
 * Redirects to dashboard if already authenticated
 */
export const noAuthGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  
  if (auth.isAuthenticated()) {
    // Redirect to the appropriate dashboard based on role
    router.navigate([auth.getDashboardRoute()]);
    return false;
  }
  
  return true;
};
