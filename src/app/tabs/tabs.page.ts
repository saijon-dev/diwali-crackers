import {
  Component,
  ChangeDetectorRef
} from '@angular/core';

import {
  IonTabs,
  IonTabBar,
  IonTabButton,
  IonIcon,
  IonLabel,
  IonBadge
} from '@ionic/angular';

import { addIcons } from 'ionicons';

import {
  CartService
} from '../services/cart.service';

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

    IonLabel,

    IonBadge

  ]

})


export class TabsPage {

  cartCount = 0;

  role: string | null = null;


  // =========================================
  // CUSTOMER TABS
  // =========================================



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
      label: 'Categories',
      route: 'adm-categories',
      icon: 'grid-outline'
    },

    {
      label: 'My Products',
      route: 'vend-products',
      icon: 'grid-outline'
    },

    {
      label: 'Orders',
      route: 'vend-orders',
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
      label: 'Products',
      route: 'adm-products',
      icon: 'cube-outline'
    },

 
    {
      label: 'Vendors',
      route: 'adm-vendors',
      icon: 'people-outline'
    },

    {
      label: 'Categories',
      route: 'adm-categories',
      icon: 'grid-outline'
    },

    {
      label: 'Orders',
      route: 'adm-orders',
      icon: 'receipt-outline'
    }



  ];


  constructor(

    private authService: AuthService,

    private cartService: CartService,

    private cdr: ChangeDetectorRef

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

  }


  // =========================================
  // GET ROLE WHEN TABS PAGE LOADS
  // =========================================

  ionViewWillEnter(): void {

    this.role =
      this.authService.getRole();

    console.log(
      'Tabs Page Role:',
      this.role
    );

  }


  // =========================================
  // CART COUNT
  // =========================================

  ngOnInit(): void {

    this.cartService.cart$.subscribe(cart => {

      console.log(
        'TABS CART UPDATE:',
        cart
      );

      this.cartCount =
        cart?.totalItems ?? 0;

      console.log(
        'TABS CART COUNT:',
        this.cartCount
      );

      this.cdr.detectChanges();

    });

  }

}