import { Routes } from '@angular/router';
import { roleGuard } from './shared/guards/role.guard';
import { noAuthGuard } from './shared/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },

  {
    path: 'register-role',
    canActivate: [noAuthGuard],
    loadComponent: () => import('./auth/auth/role-selection/role-selection.component').then(m => m.RoleSelectionComponent)
  },
  {
    path: 'register',
    canActivate: [noAuthGuard],
    loadComponent: () => import('./auth/auth/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'login',
    canActivate: [noAuthGuard],
    loadComponent: () =>
      import('./auth/auth/login/login.component')
        .then(m => m.LoginComponent)
  },
  {
    path: 'admin-login',
    canActivate: [noAuthGuard],
    loadComponent: () =>
      import('./admin-login/admin-login.component')
        .then(m => m.AdminLoginComponent)
  },

  {
    path: 'home',
    loadComponent: () =>
      import('./shared/components/main/main.component')
        .then(m => m.MainComponent)
  },

  {
    path: 'customer',
    canActivate: [roleGuard(['customer'])],
    loadChildren: () =>
      import('./customer/customer.routes')
        .then(m => m.CUSTOMER_ROUTES)
  },

  {
    path: 'orders/:id',
    loadComponent: () =>
      import('./customer/pages/order-detail/order-detail.component')
        .then(m => m.OrderDetailComponent)
  },

  {
    path: 'courier',
    canActivate: [roleGuard(['courier'])],
    loadChildren: () =>
      import('./courier/courier.routes')
        .then(m => m.COURIER_ROUTES)
  },

  {
    path: 'admin',
    canActivate: [roleGuard(['admin'])],
    loadChildren: () =>
      import('./admin/admin.routes')
        .then(m => m.ADMIN_ROUTES)
  },

  { path: '**', redirectTo: 'home' }
];
