import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStateService } from '../state/auth-state.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authState = inject(AuthStateService);
  const router    = inject(Router);

  if (authState.isAuthenticated()) {
    return true;
  }
  router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
  return false;
};

export const permissionGuard = (requiredPermission: string): CanActivateFn => {
  return (route, state) => {
    const authState = inject(AuthStateService);
    const router    = inject(Router);

    if (!authState.isAuthenticated()) {
      router.navigate(['/login']);
      return false;
    }

    if (authState.hasPermission(requiredPermission)) {
      return true;
    }

    router.navigate(['/dashboard']);
    return false;
  };
};
