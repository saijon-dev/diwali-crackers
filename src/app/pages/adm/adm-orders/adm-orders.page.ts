import {
  Component,
  OnInit,
  ChangeDetectorRef
} from '@angular/core';

import {
  IonContent,
  IonIcon,
  IonSelect,
  IonSelectOption
} from '@ionic/angular';

import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';

import { addIcons } from 'ionicons';

import {
  receiptOutline,
  chevronBackOutline,
  locationOutline,
  callOutline,
  calendarOutline,
  cashOutline,
  cubeOutline,
  personOutline,
  storefrontOutline,
  closeOutline
} from 'ionicons/icons';

import {
  OrderService
} from '../../../services/order.service';


/* =========================================================
   ORDER ITEM
========================================================= */

export interface AdminOrderItem {

  orderItemId: number;

  productId: number;

  vendorId: number;

  productName: string;

  vendorName: string;

  brandName: string | null;

  size: string | null;

  packQuantity: number | null;

  packUnit: string | null;

  productImageUrl: string | null;

  quantity: number;

  price: number;

  subtotal: number;
}


/* =========================================================
   ADMIN ORDER
========================================================= */

export interface AdminOrder {

  orderId: number;

  customerName: string;

  customerMobile: string;

  deliveryAddress: string;

  totalAmount: number;

  paymentMethod: string;

  status: string;

  expectedDeliveryDate: string;

  createdAt: string;

  items: AdminOrderItem[];
}


/* =========================================================
   ADMIN ORDER PAGE RESPONSE
========================================================= */

export interface AdminOrderPageResponse {

  content: AdminOrder[];

  empty: boolean;

  first: boolean;

  last: boolean;

  number: number;

  numberOfElements: number;

  size: number;

  totalElements: number;

  totalPages: number;

  pageable?: any;

  sort?: any;
}


@Component({
  selector: 'app-adm-orders',
  standalone: true,

  templateUrl: './adm-orders.page.html',

  styleUrls: ['./adm-orders.page.scss'],

  imports: [
    IonContent,
    IonIcon,
    IonSelect,
    IonSelectOption,
      FormsModule,
  DecimalPipe
  ]
})
export class AdmOrdersPage implements OnInit {


  /* =======================================================
     ORDERS
  ======================================================= */

  orders: AdminOrder[] = [];

  filteredOrders: AdminOrder[] = [];


  /* =======================================================
     SELECTED ORDER
  ======================================================= */

  selectedOrder: AdminOrder | null = null;

  showOrderDetails = false;


  /* =======================================================
     FILTER
  ======================================================= */

  selectedPriceRange = 'ALL';


  priceRanges = [
    {
      label: 'All Orders',
      value: 'ALL'
    },
    {
      label: 'Below ₹500',
      value: 'BELOW_500'
    },
    {
      label: '₹500 - ₹1,000',
      value: '500_1000'
    },
    {
      label: '₹1,000 - ₹5,000',
      value: '1000_5000'
    },
    {
      label: '₹5,000 - ₹10,000',
      value: '5000_10000'
    },
    {
      label: 'Above ₹10,000',
      value: 'ABOVE_10000'
    }
  ];


  /* =======================================================
     STATE
  ======================================================= */

  isLoading = false;

  errorMessage = '';


  constructor(
    private orderService: OrderService,
    private cdr: ChangeDetectorRef
  ) {

    addIcons({

      receiptOutline,

      chevronBackOutline,

      locationOutline,

      callOutline,

      calendarOutline,

      cashOutline,

      cubeOutline,

      personOutline,

      storefrontOutline,

      closeOutline

    });

  }


  ngOnInit(): void {

    this.loadOrders();

  }


  /* =======================================================
     LOAD ORDERS
  ======================================================= */

  loadOrders(): void {

    this.isLoading = true;

    this.errorMessage = '';

    this.cdr.detectChanges();


    this.orderService
      .getAdminOrders(0, 10)
      .subscribe({

        next: (response: AdminOrderPageResponse) => {

          console.log(
            'Admin Orders Response:',
            response
          );


          this.orders =
            response?.content || [];


          this.applyPriceFilter();


          this.isLoading = false;

          this.cdr.detectChanges();

        },


        error: (error) => {

          console.error(
            'Admin Orders Error:',
            error
          );


          this.orders = [];

          this.filteredOrders = [];

          this.isLoading = false;


          this.errorMessage =
            error?.error?.message ||
            error?.message ||
            'Unable to load orders.';


          this.cdr.detectChanges();

        }

      });

  }


  /* =======================================================
     PRICE FILTER
  ======================================================= */

  onPriceRangeChanged(): void {

    this.applyPriceFilter();

  }


  applyPriceFilter(): void {

    switch (this.selectedPriceRange) {

      case 'BELOW_500':

        this.filteredOrders =
          this.orders.filter(
            order =>
              order.totalAmount < 500
          );

        break;


      case '500_1000':

        this.filteredOrders =
          this.orders.filter(
            order =>
              order.totalAmount >= 500 &&
              order.totalAmount <= 1000
          );

        break;


      case '1000_5000':

        this.filteredOrders =
          this.orders.filter(
            order =>
              order.totalAmount > 1000 &&
              order.totalAmount <= 5000
          );

        break;


      case '5000_10000':

        this.filteredOrders =
          this.orders.filter(
            order =>
              order.totalAmount > 5000 &&
              order.totalAmount <= 10000
          );

        break;


      case 'ABOVE_10000':

        this.filteredOrders =
          this.orders.filter(
            order =>
              order.totalAmount > 10000
          );

        break;


      default:

        this.filteredOrders =
          [...this.orders];

        break;

    }

  }


  /* =======================================================
     OPEN ORDER DETAILS
  ======================================================= */

  openOrder(order: AdminOrder): void {

    this.selectedOrder = order;

    this.showOrderDetails = true;

    this.cdr.detectChanges();

  }


  /* =======================================================
     BACK TO ORDERS
  ======================================================= */

  backToOrders(): void {

    this.selectedOrder = null;

    this.showOrderDetails = false;

    this.cdr.detectChanges();

  }


  /* =======================================================
     STATUS CLASS
  ======================================================= */

  getStatusClass(
    status: string
  ): string {

    switch (
      status?.toUpperCase()
    ) {

      case 'PLACED':
        return 'status-placed';


      case 'CONFIRMED':
        return 'status-confirmed';


      case 'PACKED':
        return 'status-packed';


      case 'OUT_FOR_DELIVERY':
        return 'status-out-for-delivery';


      case 'DELIVERED':
        return 'status-delivered';


      case 'CANCELLED':
        return 'status-cancelled';


      default:
        return 'status-default';

    }

  }


  /* =======================================================
     STATUS LABEL
  ======================================================= */

  getStatusLabel(
    status: string
  ): string {

    if (!status) {
      return 'Unknown';
    }


    return status
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(
        /\b\w/g,
        character =>
          character.toUpperCase()
      );

  }


  /* =======================================================
     FORMAT DATE
  ======================================================= */

  formatDate(
    date: string
  ): string {

    if (!date) {
      return '-';
    }


    const parsedDate =
      new Date(date);


    if (Number.isNaN(
      parsedDate.getTime()
    )) {

      return date;

    }


    return parsedDate.toLocaleDateString(
      'en-IN',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }
    );

  }


  /* =======================================================
     FORMAT DATE TIME
  ======================================================= */

  formatDateTime(
    date: string
  ): string {

    if (!date) {
      return '-';
    }


    const parsedDate =
      new Date(date);


    if (Number.isNaN(
      parsedDate.getTime()
    )) {

      return date;

    }


    return parsedDate.toLocaleString(
      'en-IN',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }
    );

  }


  /* =======================================================
     ITEM COUNT
  ======================================================= */

  getItemCount(
    order: AdminOrder
  ): number {

    if (!order?.items) {
      return 0;
    }


    return order.items.reduce(
      (
        total,
        item
      ) =>
        total + item.quantity,
      0
    );

  }


  /* =======================================================
     PRODUCT COUNT
  ======================================================= */

  getProductCount(
    order: AdminOrder
  ): number {

    return order?.items?.length || 0;

  }


  /* =======================================================
     TRACKED PRODUCT IMAGE
  ======================================================= */

  hasProductImage(
    item: AdminOrderItem
  ): boolean {

    return !!(
      item?.productImageUrl
    );

  }

}