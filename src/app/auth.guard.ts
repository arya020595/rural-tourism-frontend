import { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {

   // Inject the Router service into the functional guard
   const router = inject(Router);

   // Check if the user is authenticated (e.g., by checking if a user ID exists in localStorage)
   const userId = localStorage.getItem('uid');
 
   if (userId) {
     // If userId exists, the user is logged in and can access the route
     return true;
   } else {
     // If userId does not exist, the user is not logged in, redirect to the login page
     router.navigate(['/login']);  // Redirect to the login page
     return false;  // Prevent route activation
   }
  
};
