import {
  Component,
  ChangeDetectorRef
} from '@angular/core';
import { finalize } from 'rxjs';

import {
  NgClass,
  DecimalPipe
} from '@angular/common';

import {
  IonContent,
  IonIcon,
  IonInput,
  IonButton,
  IonRefresher,
  IonRefresherContent
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


  imports: [
    FormsModule,
    IonContent,
    IonIcon,
    IonInput,
    IonButton,
    NgClass,
    DecimalPipe,
    IonRefresher,
    IonRefresherContent
  ]

})


export class OrdersPage {


  /* ====================================================
     MOBILE
  ==================================================== */

  orderId = '';

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

      this.orderId =
        savedMobile;

    }

  }




  
handleRefresh(event: any): void {
  const refresher = event.target;

  // Refresh the current order if an Order ID is available.
if (this.orderId.trim()) {
  this.activeRefresher = refresher;
  this.searchOrders();
  return;
}

  // Nothing to refresh yet.
  void refresher.complete();
}

private activeRefresher: any = null;

private completeRefresher(): void {
  const refresher = this.activeRefresher;
  this.activeRefresher = null;

  if (refresher && typeof refresher.complete === 'function') {
    void refresher.complete();
  }
}



  /* ====================================================
     SEARCH ORDERS
  ==================================================== */


searchOrders(): void {
const orderId = this.orderId.trim();

this.orderId = orderId;

if (!orderId) {
  this.errorMessage = 'Please enter a valid Order ID.';
  return;
}

  this.isSearching = true;
  this.hasSearched = true;
  this.showDetails = false;
  this.selectedOrder = null;
  this.orderHistory = [];
  this.orders = [];

  this.orderService
    .getCustomerOrders(orderId)
 .pipe(
  finalize(() => {
    this.isSearching = false;
    this.completeRefresher();
    this.cdr.detectChanges();
  })
)
    .subscribe({
      next: (response: any) => {
        console.log('CUSTOMER ORDER RESPONSE:', response);

        // The API returns one order object directly.
        if (response?.orderId != null) {
          this.selectedOrder = response as Order;
          this.searchedMobile = response.customerMobile ?? '';
          this.showDetails = true;

          this.loadOrderHistory(response.orderId);
        } else {
          this.errorMessage = 'No order found for this Order ID.';
        }
      },

      error: (error) => {
        console.error('GET CUSTOMER ORDER ERROR:', error);

        this.selectedOrder = null;
        this.showDetails = false;

        this.errorMessage =
          error?.status === 404
            ? 'No order found for this Order ID.'
            : error?.error?.message ||
              'Unable to retrieve order details. Please try again.';
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

private loadOrderHistory(orderId: string): void {
  this.isLoadingDetails = true;
  this.orderHistory = [];

  this.orderService
    .getOrderHistory(orderId, this.searchedMobile)
    .pipe(
      finalize(() => {
        this.isLoadingDetails = false;
        this.cdr.detectChanges();
      })
    )
    .subscribe({
      next: (response) => {
        this.orderHistory = response ?? [];
      },
      error: (error) => {
        console.error('GET ORDER HISTORY ERROR:', error);
        this.orderHistory = [];
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
    index: string,
    order: Order
  ): string {

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
goBack(): void {
  if (this.showDetails) {
    // Order Details → Find Order
    this.backToOrders();
    return;
  }

  if (this.hasSearched) {
    // Search result/error → Find Order
    this.hasSearched = false;
    this.selectedOrder = null;
    this.orderHistory = [];
    this.errorMessage = '';
    this.orderId = '';
    return;
  }

  // Find Order → Previous page
  window.history.back();
}

}