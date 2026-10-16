import { Routes } from '@angular/router';

export const routes: Routes = [

  // CUSTOMER PAGES
  {
    path: 'home',
    loadComponent: () =>
      import('./pages/home/home.page')
        .then(m => m.HomePage)
  },
  {
    path: 'cart',
    loadComponent: () =>
      import('./pages/cart/cart.page')
        .then(m => m.CartPage)
  },
  {
    path: 'categories',
    loadComponent: () =>
      import('./pages/categories/categories.page')
        .then(m => m.CategoriesPage)
  },
  {
    path: 'product/:id',
    loadComponent: () =>
      import('./pages/product/product.page')
        .then(m => m.ProductPage)
  },
  {
    path: 'orders',
    loadComponent: () =>
      import('./pages/orders/orders.page')
        .then(m => m.OrdersPage)
  },

  // ADMIN LOGIN — KEEP PUBLIC
  {
    path: 'admin-login',
    loadComponent: () =>
      import('./pages/admin-login/admin-login.page')
        .then(m => m.AdminLoginPage)
  },

  // ADMIN AND VENDOR TAB ROUTES
  {
    path: 'tabs',
    loadComponent: () =>
      import('./tabs/tabs.page')
        .then(m => m.TabsPage),
    loadChildren: () =>
      import('./tabs/tabs.routes')
        .then(m => m.TAB_ROUTES)
  },

  // DEFAULT ROUTE
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  }
];