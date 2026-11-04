import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

/**
 * Enterprise HTTP Interceptor (`HttpInterceptorFn`)
 * - Attaches multi-tenant `X-Society-Tenant-ID` and `X-Client-Version` headers
 * - Attaches `Authorization: Bearer <token>` if an access token is present in session storage
 * - Normalizes HTTP error logging for observability
 */
export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  const token = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('sms_access_token') : null;

  const headers: Record<string, string> = {
    'X-Society-Tenant-ID': environment.societyTenantId,
    'X-Client-Version': environment.version,
    Accept: 'application/json'
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const clonedRequest = req.clone({ setHeaders: headers });

  return next(clonedRequest).pipe(
    catchError((error: HttpErrorResponse) => {
      console.error(`[API Interceptor] HTTP ${error.status} on ${req.method} ${req.url}:`, error.message);
      return throwError(() => error);
    })
  );
};

