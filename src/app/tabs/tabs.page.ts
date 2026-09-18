import { Component } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import {
  IonIcon,
  IonRouterOutlet
} from '@ionic/angular';

import { addIcons } from 'ionicons';

import {
  homeOutline,
  gridOutline,
  cartOutline,
  cubeOutline,
  syncOutline,
  storefrontOutline,
  peopleOutline,
  receiptOutline,
  ellipsisHorizontalOutline
} from 'ionicons/icons';

import { filter } from 'rxjs';
import { AuthService } from '../services/auth.service';


interface TabItem {
  label: string;
  route: string;
  icon: string;
}

@Component({
  selector: 'app-tabs',
  standalone: true,
  templateUrl: './tabs.page.html',
  styleUrls: ['./tabs.page.scss'],
  imports: [
    IonRouterOutlet,
    IonIcon
  ]
})



export class TabsPage {

  role: string | null = null;

  // =========================================
  // CUSTOMER TABS
  // =========================================

  customerTabs: TabItem[] = [
    {
      label: 'Home',
      route: '/tabs/home',
      icon: 'home-outline'
    },
    {
      label: 'Categories',
      route: '/tabs/categories',
      icon: 'grid-outline'
    },
    {
      label: 'Cart',
      route: '/tabs/cart',
      icon: 'cart-outline'
    }
  ];


  // =========================================
  // VENDOR TABS
  // =========================================

  vendorTabs: TabItem[] = [
    {
      label: 'Products',
      route: '/tabs/products',
      icon: 'cube-outline'
    },
    {
      label: 'Categories',
      route: '/tabs/categories',
      icon: 'grid-outline'
    },
    {
      label: 'Requests',
      route: '/tabs/requests',
      icon: 'sync-outline'
    },
    {
      label: 'Shop',
      route: '/tabs/shop',
      icon: 'storefront-outline'
    }
  ];


  // =========================================
  // ADMIN TABS
  // =========================================

  adminTabs: TabItem[] = [
    {
      label: 'Home',
      route: '/tabs/adm-home',
      icon: 'home-outline'
    },
    {
      label: 'Vendors',
      route: '/tabs/adm-vendors',
      icon: 'people-outline'
    },
    {
      label: 'Orders',
      route: '/tabs/adm-orders',
      icon: 'receipt-outline'
    },
    {
      label: 'More',
      route: '/tabs/adm-profile',
      icon: 'ellipsis-horizontal-outline'
    }
  ];


  constructor(
    private router: Router,
    private authService: AuthService
  ) {

    addIcons({
      homeOutline,
      gridOutline,
      cartOutline,
      cubeOutline,
      syncOutline,
      storefrontOutline,
      peopleOutline,
      receiptOutline,
      ellipsisHorizontalOutline
    });

    // Get role when TabsPage loads
    this.role = this.authService.getRole();

    console.log('Tabs Page Role:', this.role);


    // Update role whenever navigation happens
    this.router.events
      .pipe(
        filter(
          event => event instanceof NavigationEnd
        )
      )
      .subscribe(() => {

        this.role = this.authService.getRole();

        console.log(
          'Current Tabs Role:',
          this.role
        );

      });
  }


  // =========================================
  // NAVIGATION
  // =========================================

  navigateTo(route: string): void {

    this.router.navigateByUrl(route);

  }


  // =========================================
  // ACTIVE TAB
  // =========================================

  isActive(route: string): boolean {

    return this.router.url === route;

  }
}