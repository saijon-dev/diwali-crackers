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
  }

];