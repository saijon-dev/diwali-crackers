import { Component } from '@angular/core';

import {
  IonTabs,
  IonTabBar,
  IonTabButton,
  IonIcon,
  IonLabel
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

    IonTabs,

    IonTabBar,

    IonTabButton,

    IonIcon,

    IonLabel

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

      route: 'home',

      icon: 'home-outline'

    },

    {

      label: 'Categories',

      route: 'categories',

      icon: 'grid-outline'

    },

    {

      label: 'Cart',

      route: 'cart',

      icon: 'cart-outline'

    }

  ];


  // =========================================
  // VENDOR TABS
  // =========================================

  vendorTabs: TabItem[] = [

    {

      label: 'Products',

      route: 'products',

      icon: 'cube-outline'

    },

    {

      label: 'My Products',

      route: 'vend-products',

      icon: 'grid-outline'

    },

    {

      label: 'Requests',

      route: 'requests',

      icon: 'sync-outline'

    },

    {

      label: 'Shop',

      route: 'shop',

      icon: 'storefront-outline'

    }

  ];


  // =========================================
  // ADMIN TABS
  // =========================================

  adminTabs: TabItem[] = [

    {

      label: 'Home',

      route: 'adm-home',

      icon: 'home-outline'

    },

    {

      label: 'Vendors',

      route: 'adm-vendors',

      icon: 'people-outline'

    },

    {

      label: 'Orders',

      route: 'adm-orders',

      icon: 'receipt-outline'

    },

  {

      label: 'Products',

      route: 'adm-products',

      icon: 'cube-outline'

    }

  ];


  constructor(

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

    });}


    // Get role when TabsPage loads
 ionViewWillEnter(): void {

    this.role =
      this.authService.getRole();

    console.log(
      'Tabs Page Role:',
      this.role
    );

  }

  

}