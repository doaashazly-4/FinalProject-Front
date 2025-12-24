import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class CustomerGuard implements CanActivate {
  constructor(private router: Router) { }

  canActivate(): boolean {
    const customerId = localStorage.getItem('customer_id');   
    console.log(customerId);
    if (!customerId) {
      console.warn('No customer_id found in session');
      return false;
    }

    return true;
  }

}
