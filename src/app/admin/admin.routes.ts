import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./admin.component').then(m => m.AdminComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.AdminDashboardComponent)
      },
      {
        path: 'carrier-approvals',
        loadComponent: () => import('./pages/carrier-approvals/carrier-approvals.component').then(m => m.CarrierApprovalsComponent)
      },
      {
        path: 'users',
        loadComponent: () => import('./pages/users/users.component').then(m => m.AdminUsersComponent)
      },
      {
        path: 'orders',
        loadComponent: () => import('./pages/orders/orders.component').then(m => m.AdminOrdersComponent)
      },
      {
        path: 'disputes',
        loadComponent: () => import('./pages/disputes/disputes.component').then(m => m.DisputesComponent)
      },
      {
        path: 'reports',
        loadComponent: () => import('./pages/reports/reports.component').then(m => m.ReportsComponent)
      },
      {
        path: 'settings',
        loadComponent: () => import('./pages/settings/settings.component').then(m => m.AdminSettingsComponent)
      }
    ]
  }
];
