import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { SocietyStateService } from '../../services/society-state.service';
import { UserRole } from '../../models/society.model';

/**
 * Functional Route Guard (`CanActivateFn`) enforcing Role-Based Access Control (RBAC).
 */
export const roleGuard = (allowedRoles: UserRole[]): CanActivateFn => {
  return () => {
    const state = inject(SocietyStateService);
    const activeRole = state.currentUserRole();
    if (allowedRoles.includes(activeRole)) {
      return true;
    }
    state.showToast('msg.roleRestricted', 'warning', { roles: allowedRoles.join(', ') });
    state.setView('dashboard');
    return false;
  };
};

