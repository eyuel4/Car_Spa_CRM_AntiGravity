import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const requiredRoles = route.data['roles'] as string[];

    if (!requiredRoles || requiredRoles.length === 0) {
        return true;
    }

    const user = authService.getCurrentUser();

    if (user && requiredRoles.includes(user.role)) {
        return true;
    }

    // User doesn't have required role
    router.navigate(['/dashboard']);
    return false;
};
