import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class CustomerGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(): boolean {
    const customerId = localStorage.getItem('customer_id');
    if (!customerId) {
      this.router.navigate(['/login'], { queryParams: { role: 'client' } });
      return false;
    }
    return true;
  }
}
