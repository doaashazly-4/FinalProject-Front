import { inject, isDevMode } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService, UserRole } from '../services/auth.service';

export function roleGuard(requiredRoles: Exclude<UserRole, null>[]): CanActivateFn {
  return (route: ActivatedRouteSnapshot) => {
    const auth = inject(AuthService);
    const router = inject(Router);
    
    // ========== DEV MODE BYPASS ==========
    // Allow access in development mode with ?dev=true query param
    // Usage: http://localhost:4200/admin?dev=true
    const devBypass = route.queryParams['dev'] === 'true';
    if (isDevMode() && devBypass) {
      console.warn('⚠️ DEV MODE: Auth bypass enabled for', requiredRoles);
      // Auto-set the role for dev mode
      if (requiredRoles.length > 0) {
        auth.devSetRole(requiredRoles[0]);
      }
      return true;
    }
    
    // التحقق أولاً من تسجيل الدخول
    if (!auth.isAuthenticated()) {
      router.navigate(['/login']);
      return false;
    }
    
    // التحقق من الـ role المطلوب
    const allowed = auth.hasRole(requiredRoles);
    if (!allowed) {
      // If the user is authenticated but not allowed for this route,
      // redirect them to their own dashboard instead of the login page.
      const dashboardRoute = auth.getDashboardRoute();
      if (dashboardRoute) {
        router.navigate([dashboardRoute]);
      } else {
        router.navigate(['/home']);
      }
      return false;
    }
    return true;
  };
}

