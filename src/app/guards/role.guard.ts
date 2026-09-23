import { inject } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  Router
} from '@angular/router';

import { AuthService } from '../services/auth.service';


export const roleGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot
) => {

  const authService = inject(AuthService);
  const router = inject(Router);


  /* =========================================
     GET LOGGED-IN USER ROLE
     ========================================= */

  const userRole =
    authService.getRole();


  /* =========================================
     GET ALLOWED ROLES FROM ROUTE
     ========================================= */

  const allowedRoles =
    route.data['roles'] as string[] | undefined;


  /* =========================================
     NO ROLE CONFIGURATION
     ========================================= */

  if (!allowedRoles || allowedRoles.length === 0) {

    return true;

  }


  /* =========================================
     CHECK ROLE
     ========================================= */

  if (
    userRole &&
    allowedRoles.includes(userRole.toUpperCase())
  ) {

    return true;

  }


  /* =========================================
     WRONG ROLE
     ========================================= */

  if (userRole === 'ADMIN') {

    return router.createUrlTree([
      '/tabs/adm-home'
    ]);

  }


  if (userRole === 'VENDOR') {

    return router.createUrlTree([
      '/tabs/products'
    ]);

  }


  /* =========================================
     UNKNOWN / NO ROLE
     ========================================= */

  return router.createUrlTree([
    '/admin-login'
  ]);

};