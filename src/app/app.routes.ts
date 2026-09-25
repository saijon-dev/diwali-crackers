import { Routes } from '@angular/router';

export const routes: Routes = [

  {
    path: 'splash',
    loadComponent: () =>
      import('./pages/splash/splash.page')
        .then(m => m.SplashPage)
  },

  {
    path: 'admin-login',
    loadComponent: () =>
      import('./pages/admin-login/admin-login.page')
        .then(m => m.AdminLoginPage)
  },

  {
    path: 'tabs',
    loadComponent: () =>
      import('./tabs/tabs.page')
        .then(m => m.TabsPage),

    loadChildren: () =>
      import('./tabs/tabs.routes')
        .then(m => m.TAB_ROUTES)
  },

  {
    path: '',
    redirectTo: 'splash',
    pathMatch: 'full'
  },
  {
    path: 'orders',
    loadComponent: () => import('./pages/orders/orders.page').then( m => m.OrdersPage)
  },
  {
    path: 'vend-orders',
    loadComponent: () => import('./admin/vend-orders/vend-orders.page').then( m => m.VendOrdersPage)
  },
  {
    path: 'vend-orders',
    loadComponent: () => import('./pages/admin/vend-orders/vend-orders.page').then( m => m.VendOrdersPage)
  },
  {
    path: 'adm-orders',
    loadComponent: () => import('./pages/adm/adm-orders/adm-orders.page').then( m => m.AdmOrdersPage)
  }

];