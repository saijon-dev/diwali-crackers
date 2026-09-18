import { Routes } from '@angular/router';

export const routes: Routes = [

  // ==============================
  // SPLASH
  // ==============================
  {
    path: 'splash',
    loadComponent: () =>
      import('./pages/splash/splash.page')
        .then(m => m.SplashPage)
  },


  // ==============================
  // MAIN TABS
  // ==============================
  {
    path: 'tabs',

    loadComponent: () =>
      import('./tabs/tabs.page')
        .then(m => m.TabsPage),

    children: [

      // CUSTOMER HOME
      {
        path: 'home',
        loadComponent: () =>
          import('./pages/home/home.page')
            .then(m => m.HomePage)
      },

      {
  path: 'product/:id',
  loadComponent: () =>
    import('./pages/product/product.page')
      .then(m => m.ProductPage)
},


{
  path:'categories',
  loadComponent: () =>
    import('./pages/categories/categories.page')
         .then(m => m.CategoriesPage)
},


      // ==========================
      // ADMIN PAGES
      // ==========================



      {
        path: 'adm-vendors',
        loadComponent: () =>
          import('./pages/adm/adm-vendors/adm-vendors.page')
            .then(m => m.AdmVendorsPage)
      },

      {
        path: 'adm-add-vendor',
        loadComponent: () =>
          import('./pages/adm/adm-add-vendor/adm-add-vendor.page')
            .then(m => m.AdmAddVendorPage)
      },


      // ==========================
      // EXISTING VENDOR PAGES
      // ==========================

      {
        path: 'products',
        loadComponent: () =>
          import('./pages/admin/admin-products/admin-products.page')
            .then(m => m.AdminProductsPage)
      },

      {
        path: 'add-product',
        loadComponent: () =>
          import('./pages/admin/admin-add-product/admin-add-product.page')
            .then(m => m.AdminAddProductPage)
      },


      // ==========================
      // DEFAULT
      // ==========================

      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full'
      }

    ]
  },


  // ==============================
  // ADMIN LOGIN
  // ==============================
  {
    path: 'admin-login',
    loadComponent: () =>
      import('./pages/admin/admin-login/admin-login.page')
        .then(m => m.AdminLoginPage)
  },


  // ==============================
  // FALLBACK
  // ==============================
  {
    path: '',
    redirectTo: 'splash',
    pathMatch: 'full'
  }

];