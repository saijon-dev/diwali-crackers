import { Routes } from '@angular/router';

export const TAB_ROUTES: Routes = [

  /* =========================================
     CUSTOMER
  ========================================= */

  {
    path: 'home',
    loadComponent: () =>
      import('../pages/home/home.page')
        .then(m => m.HomePage)
  },

  {
    path: 'search',
    loadComponent: () =>
      import('../pages/search/search.page')
        .then(m => m.SearchPage)
  },

  {
    path: 'categories',
    loadComponent: () =>
      import('../pages/categories/categories.page')
        .then(m => m.CategoriesPage)
  },

  {
    path: 'cart',
    loadComponent: () =>
      import('../pages/cart/cart.page')
        .then(m => m.CartPage)
  },

  {
    path: 'product/:id',
    loadComponent: () =>
      import('../pages/product/product.page')
        .then(m => m.ProductPage)
  },
{
  path: 'orders',
  loadComponent: () =>
    import('../pages/orders/orders.page')
      .then(m => m.OrdersPage)
},

  /* =========================================
     ADMIN
  ========================================= */

  {
    path: 'adm-home',
    loadComponent: () =>
      import('../pages/adm/adm-home/adm-home.page')
        .then(m => m.AdmHomePage)
  },

  {
    path: 'adm-vendors',
    loadComponent: () =>
      import('../pages/adm/adm-vendors/adm-vendors.page')
        .then(m => m.AdmVendorsPage)
  },

  {
    path: 'adm-add-vendor',
    loadComponent: () =>
      import('../pages/adm/adm-add-vendor/adm-add-vendor.page')
        .then(m => m.AdmAddVendorPage)
  },

  {
    path: 'adm-edit/:id',
    loadComponent: () =>
      import('../pages/adm/adm-edit/adm-edit.page')
        .then(m => m.AdmEditPage)
  },

  {
    path: 'adm-products',
    loadComponent: () =>
      import('../pages/adm/adm-products/adm-products.page')
        .then(m => m.AdmProductsPage)
  },
  {
    path: 'adm-orders',
    loadComponent: () =>
      import('../pages/adm/adm-orders/adm-orders.page')
        .then(m => m.AdmOrdersPage)
  },

  {
    path: 'adm-categories',
    loadComponent: () =>
        import('../pages/adm/adm-categories/adm-categories.page')
         .then(m=> m.AdmCategoriesPage)
  },


  /* =========================================
     VENDOR
  ========================================= */

  {
    path: 'products',
    loadComponent: () =>
      import('../pages/admin/admin-products/admin-products.page')
        .then(m => m.AdminProductsPage)
  },

  {
    path: 'vend-products',
    loadComponent: () =>
      import('../pages/admin/vend-products/vend-products.page')
        .then(m => m.VendProductsPage)
  },

  {
    path: 'admin-edit/:id',
    loadComponent: () =>
      import('../pages/admin/admin-edit/admin-edit.page')
        .then(m => m.AdminEditPage)
  },

  {
    path: 'add-product',
    loadComponent: () =>
      import('../pages/admin/admin-add-product/admin-add-product.page')
        .then(m => m.AdminAddProductPage)
  },

  {
  path: 'vend-orders',
  loadComponent: () =>
    import('../pages/admin/vend-orders/vend-orders.page')
      .then(m => m.VendOrdersPage)
},


  /* =========================================
     DEFAULT TAB
  ========================================= */

  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  }

];