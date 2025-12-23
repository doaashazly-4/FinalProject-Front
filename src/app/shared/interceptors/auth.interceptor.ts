import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpErrorResponse
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {

  /**
   * 🔓 STEP 1: Skip authentication for PUBLIC customer endpoints
   *
   * Customer APIs do NOT use JWT authentication.
   * If we attach a token here, the backend will reject the request
   * and cause redirect loops or silent failures.
   */
  if (req.url.includes('/Customer')) {
    return next(req);
  }

  /**
   * 🔐 STEP 2: Inject required services ONLY for protected requests
   */
  const authService = inject(AuthService);
  const router = inject(Router);

  /**
   * 🔑 STEP 3: Read JWT token (if exists)
   */
  const token = authService.getToken();

  /**
   * 🧾 STEP 4: Clone request and attach Authorization header if token exists
   *
   * Important:
   * - HttpRequest is immutable
   * - We must clone it to modify headers
   */
  let authReq = req;
  if (token) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  /**
   * 🚀 STEP 5: Forward the request and handle errors globally
   */
  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {

      /**
       * ⛔ STEP 6: Handle UNAUTHORIZED (401)
       *
       * This means:
       * - Token expired
       * - Token invalid
       * - User logged out elsewhere
       *
       * We clean session and redirect to login.
       */
      if (error.status === 401) {
        authService.logout();
        router.navigate(['/login']);
      }

      /**
       * 🚫 STEP 7: Handle FORBIDDEN (403)
       *
       * User is authenticated but not allowed to access the resource.
       * Example: Supplier trying to access Admin API.
       */
      if (error.status === 403) {
        router.navigate(['/home']);
      }

      /**
       * ❗ STEP 8: Re-throw error so component/service can react if needed
       */
      return throwError(() => error);
    })
  );
};
