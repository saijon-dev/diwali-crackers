import {
  Component,
  ChangeDetectorRef
} from '@angular/core';

import {
  NgClass,
  DecimalPipe
} from '@angular/common';

import {
  IonContent,
  IonIcon,
  IonInput,
  IonButton
} from '@ionic/angular';

import { FormsModule } from '@angular/forms';

import { addIcons } from 'ionicons';

import {
  arrowBackOutline,
  receiptOutline,
  searchOutline,
  calendarOutline,
  locationOutline,
  callOutline,
  cubeOutline,
  chevronForwardOutline,
  timeOutline,
  checkmarkCircleOutline,
  alertCircleOutline,
  closeCircleOutline,
  hourglassOutline
} from 'ionicons/icons';

import {
  OrderService,
  Order,
  OrderHistory,
  OrderItem
} from '../../services/order.service';

import { CartService } from '../../services/cart.service';


@Component({

  selector: 'app-orders',

  standalone: true,

  templateUrl: './orders.page.html',

  styleUrls: ['./orders.page.scss'],

  imports: [
    FormsModule,
    IonContent,
    IonIcon,
    IonInput,
    IonButton,
    NgClass,
    DecimalPipe
  ]

})


export class OrdersPage {


  /* ====================================================
     MOBILE
  ==================================================== */

  customerMobile = '';

  searchedMobile = '';


  /* ====================================================
     ORDERS
  ==================================================== */

  orders: Order[] = [];

  selectedOrder: Order | null = null;

  orderHistory: OrderHistory[] = [];


  /* ====================================================
     UI STATE
  ==================================================== */

  isSearching = false;

  isLoadingDetails = false;

  hasSearched = false;

  showDetails = false;

  errorMessage = '';


  constructor(

    private orderService: OrderService,

    private cartService: CartService,

    private cdr: ChangeDetectorRef

  ) {

    addIcons({

      arrowBackOutline,

      receiptOutline,

      searchOutline,

      calendarOutline,

      locationOutline,

      callOutline,

      cubeOutline,

      chevronForwardOutline,

      timeOutline,

      checkmarkCircleOutline,

      alertCircleOutline,

      closeCircleOutline,

      hourglassOutline

    });

  }


  /* ====================================================
     PAGE ENTER
  ==================================================== */

  ionViewWillEnter(): void {

    const savedMobile =
      this.cartService.getCustomerMobile();


    if (savedMobile) {

      this.customerMobile =
        savedMobile;

    }

  }


  /* ====================================================
     SEARCH ORDERS
  ==================================================== */

  searchOrders(): void {

    const mobile =
      this.customerMobile.trim();


    if (!mobile) {

      this.errorMessage =
        'Please enter your mobile number.';

      return;

    }


    if (
      !/^[0-9]{10}$/.test(mobile)
    ) {

      this.errorMessage =
        'Please enter a valid 10 digit mobile number.';

      return;

    }


    this.errorMessage = '';

    this.isSearching = true;

    this.hasSearched = true;

    this.showDetails = false;

    this.selectedOrder = null;

    this.orderHistory = [];

    this.orders = [];

    this.searchedMobile = mobile;


    this.orderService
      .getCustomerOrders(mobile)
      .subscribe({
next: (response) => {

  console.log(
    'CUSTOMER ORDERS RESPONSE:',
    response
  );


  this.orders =
    response?.content ?? [];


  console.log(
    'CUSTOMER ORDERS:',
    this.orders
  );


  this.isSearching = false;

  this.cdr.detectChanges();

},


        error: (error) => {

          console.error(
            'GET CUSTOMER ORDERS ERROR:',
            error
          );

          this.orders = [];

          this.isSearching = false;

          this.cdr.detectChanges();

        }

      });

  }


  /* ====================================================
     OPEN ORDER DETAILS
  ==================================================== */

  openOrder(
    order: Order
  ): void {

    this.isLoadingDetails = true;

    this.showDetails = true;

    this.selectedOrder = order;

    this.orderHistory = [];


    this.orderService
      .getOrderDetails(
        order.orderId,
        this.searchedMobile
      )
      .subscribe({

        next: (response) => {

          this.selectedOrder =
            response;

          this.loadOrderHistory(
            response.orderId
          );

        },


        error: (error) => {

          console.error(
            'GET ORDER DETAILS ERROR:',
            error
          );

          this.isLoadingDetails = false;

          this.cdr.detectChanges();

        }

      });

  }


  /* ====================================================
     ORDER HISTORY
  ==================================================== */

  private loadOrderHistory(
    orderId: number
  ): void {

    this.orderService
      .getOrderHistory(
        orderId,
        this.searchedMobile
      )
      .subscribe({

        next: (response) => {

          this.orderHistory =
            response ?? [];

          this.isLoadingDetails =
            false;

          this.cdr.detectChanges();

        },


        error: (error) => {

          console.error(
            'GET ORDER HISTORY ERROR:',
            error
          );

          this.orderHistory = [];

          this.isLoadingDetails =
            false;

          this.cdr.detectChanges();

        }

      });

  }


  /* ====================================================
     BACK TO ORDERS
  ==================================================== */

  backToOrders(): void {

    this.showDetails = false;

    this.selectedOrder = null;

    this.orderHistory = [];

  }


  /* ====================================================
     STATUS CLASS
  ==================================================== */

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


      case 'PROCESSING':

        return 'status-processing';


      case 'SHIPPED':

        return 'status-shipped';


      case 'DELIVERED':

        return 'status-delivered';


      case 'CANCELLED':

      case 'CANCELED':

        return 'status-cancelled';


      default:

        return 'status-default';

    }

  }


  /* ====================================================
     STATUS ICON
  ==================================================== */

  getStatusIcon(
    status: string
  ): string {

    switch (
      status?.toUpperCase()
    ) {

      case 'PLACED':

        return 'time-outline';


      case 'CONFIRMED':

        return 'checkmark-circle-outline';


      case 'PROCESSING':

        return 'hourglass-outline';


      case 'SHIPPED':

        return 'cube-outline';


      case 'DELIVERED':

        return 'checkmark-circle-outline';


      case 'CANCELLED':

      case 'CANCELED':

        return 'close-circle-outline';


      default:

        return 'alert-circle-outline';

    }

  }


  /* ====================================================
     FORMAT DATE
  ==================================================== */

  formatDate(
    value: string
  ): string {

    if (!value) {

      return '';

    }


    const date =
      new Date(value);


    if (isNaN(
      date.getTime()
    )) {

      return value;

    }


    return date.toLocaleDateString(
      'en-IN',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }
    );

  }


  /* ====================================================
     FORMAT DATE TIME
  ==================================================== */

  formatDateTime(
    value: string
  ): string {

    if (!value) {

      return '';

    }


    const date =
      new Date(value);


    if (isNaN(
      date.getTime()
    )) {

      return value;

    }


    return date.toLocaleString(
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


  /* ====================================================
     TRACK BY ORDER
  ==================================================== */

  trackOrder(
    index: number,
    order: Order
  ): number {

    return order.orderId;

  }


  /* ====================================================
     TRACK BY ITEM
  ==================================================== */

  trackItem(
    index: number,
    item: OrderItem
  ): number {

    return item.orderItemId;

  }


  /* ====================================================
     TRACK BY HISTORY
  ==================================================== */

  trackHistory(
    index: number,
    history: OrderHistory
  ): string {

    return (
      history.changedAt +
      history.status
    );

  }

}