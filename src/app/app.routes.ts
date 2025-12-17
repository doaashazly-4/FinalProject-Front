import { Routes } from '@angular/router';
import { roleGuard } from './shared/guards/role.guard';
import { noAuthGuard } from './shared/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },
  {
    path: 'role-selection',
    canActivate: [noAuthGuard],
    loadComponent: () => import('./auth/auth/role-selection/role-selection.component').then(m => m.RoleSelectionComponent)
  },
  {
    path: 'login',
    canActivate: [noAuthGuard],
    loadComponent: () => import('./auth/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    canActivate: [noAuthGuard],
    loadComponent: () => import('./auth/auth/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./auth/auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent)
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./auth/auth/reset-password/reset-password.component').then(m => m.ResetPasswordComponent)
  },
  
  {
    path: 'home',
    loadComponent: () => import('./shared/components/main/main.component').then(m => m.MainComponent)
  },
  {
    path: 'available-couriers',
    loadComponent: () => import('./pages/available-couriers/available-couriers.component').then(m => m.AvailableCouriersComponent)
  },
  {
    path: 'customer',
    canActivate: [roleGuard(['customer'])],
    loadChildren: () => import('./customer/customer.routes').then(m => m.CUSTOMER_ROUTES)
  },
  // Alias for older "carrier" URI — redirect to the courier routes
  {
    path: 'carrier',
    redirectTo: 'courier',
    pathMatch: 'full'
  },
  {
    path: 'customer-otp-login',
    canActivate: [noAuthGuard],
    loadComponent: () => import('./customer/pages/otp-login/otp-login.component').then(m => m.CustomerOTPLoginComponent)
  },
  {
    path: 'courier',
    canActivate: [roleGuard(['courier'])],
    loadChildren: () => import('./courier/courier.routes').then(m => m.COURIER_ROUTES)
  },
  {
    path: 'admin',
    canActivate: [roleGuard(['admin'])],
    loadChildren: () => import('./admin/admin.routes').then(m => m.ADMIN_ROUTES)
  },
  {
    path: 'supplier',
    canActivate: [roleGuard(['supplier'])],
    loadChildren: () => import('./supplier/supplier.routes').then(m => m.SUPPLIER_ROUTES)
  },
  {
    path: '**',
    redirectTo: 'home'
  }
];
