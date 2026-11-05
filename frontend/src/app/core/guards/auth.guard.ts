import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { AccessControlService, VIEW_TO_MODULE } from '../services/access-control.service';
import { SocietyStateService } from '../../services/society-state.service';

/** Redirects unauthenticated users to `/login`. */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.isAuthenticated() ? true : inject(Router).createUrlTree(['/login']);
};

/** Keeps signed-in users away from `/login` and `/register`. */
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.isAuthenticated() ? inject(Router).createUrlTree(['/dashboard']) : true;
};

/** Blocks a route when the resident's `read` access to its module was revoked. */
export const accessGuard: CanActivateFn = route => {
  const access = inject(AccessControlService);
  const state = inject(SocietyStateService);
  const router = inject(Router);

  const moduleId = VIEW_TO_MODULE[route.routeConfig?.path ?? ''];
  if (!moduleId || access.can(moduleId, 'read')) {
    return true;
  }
  state.showToast('Read access to this module was revoked by your society admin.', 'warning');
  return router.createUrlTree(['/dashboard']);
};

