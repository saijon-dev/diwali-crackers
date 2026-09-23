import {
  ChangeDetectorRef,
  Component,
  OnInit
} from '@angular/core';

import {
  IonContent,
  IonIcon
} from '@ionic/angular';

import {
  addIcons
} from 'ionicons';

import {
  cubeOutline,
  peopleOutline,
  receiptOutline,
  storefrontOutline,
  arrowForwardOutline,
  addOutline,
  timeOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  trendingUpOutline,
  gridOutline
} from 'ionicons/icons';

import { Router } from '@angular/router';


interface DashboardStat {
  label: string;
  value: number;
  icon: string;
  description: string;
  route?: string;
}


interface RecentOrder {
  orderId: string;
  customerName: string;
  amount: number;
  status: 'PENDING' | 'CONFIRMED' | 'DELIVERED' | 'CANCELLED';
}


@Component({
  selector: 'app-adm-home',

  templateUrl: './adm-home.page.html',

  styleUrls: ['./adm-home.page.scss'],

  standalone: true,

  imports: [
    IonContent,
    IonIcon
  ]
})
export class AdmHomePage implements OnInit {


  // =====================================================
  // ADMIN NAME
  // =====================================================

  adminName = 'Admin';


  // =====================================================
  // DASHBOARD STATISTICS
  // =====================================================
  //
  // Temporary frontend values.
  // These will later come from backend APIs.
  //

  dashboardStats: DashboardStat[] = [

    {
      label: 'Vendors',
      value: 12,
      icon: 'people-outline',
      description: 'Registered vendors',
      route: '/tabs/adm-vendors'
    },

    {
      label: 'Products',
      value: 48,
      icon: 'cube-outline',
      description: 'Admin added products',
      route: '/tabs/adm-products'
    },

    {
      label: 'Orders',
      value: 126,
      icon: 'receipt-outline',
      description: 'Total orders',
      route: '/tabs/adm-orders'
    },

    {
      label: 'Shops',
      value: 12,
      icon: 'storefront-outline',
      description: 'Vendor shops'
    }

  ];


  // =====================================================
  // ADDITIONAL SUMMARY
  // =====================================================

  pendingOrders = 18;

  activeVendors = 10;

  inactiveVendors = 2;

  activeProducts = 43;

  inactiveProducts = 5;


  // =====================================================
  // RECENT ORDERS
  // =====================================================
  //
  // Temporary frontend data.
  //

  recentOrders: RecentOrder[] = [

    {
      orderId: '#ORD-1024',
      customerName: 'Rahul',
      amount: 1850,
      status: 'PENDING'
    },

    {
      orderId: '#ORD-1023',
      customerName: 'Sanjay',
      amount: 3200,
      status: 'CONFIRMED'
    },

    {
      orderId: '#ORD-1022',
      customerName: 'Priya',
      amount: 1450,
      status: 'DELIVERED'
    },

    {
      orderId: '#ORD-1021',
      customerName: 'Kiran',
      amount: 2750,
      status: 'DELIVERED'
    }

  ];


  // =====================================================
  // CONSTRUCTOR
  // =====================================================

  constructor(
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {

    addIcons({

      peopleOutline,

      cubeOutline,

      receiptOutline,

      storefrontOutline,

      arrowForwardOutline,

      addOutline,

      timeOutline,

      checkmarkCircleOutline,

      closeCircleOutline,

      trendingUpOutline,

      gridOutline

    });

  }


  // =====================================================
  // INIT
  // =====================================================

  ngOnInit(): void {

    /*
     * Dashboard API calls will be added here later.
     */
  }


  // =====================================================
  // NAVIGATION
  // =====================================================

  openRoute(route: string): void {

    this.router.navigateByUrl(route);

  }


  // =====================================================
  // OPEN VENDORS
  // =====================================================

  openVendors(): void {

    this.router.navigate([
      '/tabs/adm-vendors'
    ]);

  }


  // =====================================================
  // OPEN PRODUCTS
  // =====================================================

  openProducts(): void {

    this.router.navigate([
      '/tabs/adm-products'
    ]);

  }


  // =====================================================
  // OPEN ORDERS
  // =====================================================

  openOrders(): void {

    this.router.navigate([
      '/tabs/adm-orders'
    ]);

  }


  // =====================================================
  // ADD VENDOR
  // =====================================================

  addVendor(): void {

    this.router.navigate([
      '/tabs/adm-add-vendor'
    ]);

  }


  // =====================================================
  // FORMAT CURRENCY
  // =====================================================

  formatAmount(amount: number): string {

    return `₹${amount.toLocaleString('en-IN')}`;

  }

  openCategories(): void {
  this.router.navigate([
    '/tabs/adm-categories'
  ]);
}

}