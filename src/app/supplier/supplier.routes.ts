import { Routes } from '@angular/router';

export const SUPPLIER_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./supplier.component').then(m => m.SupplierComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/dashboard/dashboard.component')
          .then(m => m.SupplierDashboardComponent)
      },
      {
        path: 'create-shipment',
        loadComponent: () => import('./pages/create-shipment/create-shipment.component')
          .then(m => m.CreateShipmentComponent)
      },
      {
        path: 'shipments',
        loadComponent: () => import('./pages/shipments/shipments.component')
          .then(m => m.ShipmentsComponent)
      },
      {
        path: 'track',
        loadComponent: () => import('./pages/track/track.component')
          .then(m => m.TrackComponent)
      },
      {
        path: 'reports',
        loadComponent: () => import('./pages/reports/reports.component')
          .then(m => m.SupplierReportsComponent)
      },
      {
        path: 'settings',
        loadComponent: () => import('./pages/settings/settings.component')
          .then(m => m.SettingsComponent)
      },
      // Legacy routes - redirect to new ones
      {
        path: 'orders',
        redirectTo: 'shipments',
        pathMatch: 'full'
      },
      {
        path: 'products',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'inventory',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  }
];
