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

  const authService = inject(AuthService);
  const router = inject(Router);

  const token = authService.getToken();

  // ✅ ALWAYS attach token if it exists
  let authReq = req;
  if (token) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {

      if (error.status === 401) {
        /**
         * ❗ Customer flow:
         * - Do NOT auto-logout
         * - Let component decide (OTP, re-login, etc.)
         */
        console.warn('401 Unauthorized:', req.url);
      }

      if (error.status === 403) {
        router.navigate(['/home']);
      }

      return throwError(() => error);
    })
  );
};
