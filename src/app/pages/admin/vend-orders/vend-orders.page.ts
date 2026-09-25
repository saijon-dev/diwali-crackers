import {
  Component,
  ChangeDetectorRef
} from '@angular/core';

import {
  IonContent,
  IonIcon,
  IonButton
} from '@ionic/angular';

import { DecimalPipe } from '@angular/common';

import { addIcons } from 'ionicons';

import {
  receiptOutline,
  cubeOutline,
  calendarOutline,
  callOutline,
  locationOutline,
  checkmarkCircleOutline,
  timeOutline,
  chevronForwardOutline,
  arrowBackOutline,
  closeCircleOutline,
  alertCircleOutline,
  hourglassOutline
} from 'ionicons/icons';

import {
  VendorOrderService,
  VendorOrder,
  VendorOrderItem
} from '../../../services/vendor-order.service';


type OrderView =
  'new' |
  'confirmed';


@Component({

  selector: 'app-ven-orders',

  standalone: true,

  templateUrl: './vend-orders.page.html',

  styleUrls: ['./vend-orders.page.scss'],

  imports: [
    IonContent,
    IonIcon,
    IonButton,
    DecimalPipe
  ]

})


export class VendOrdersPage {


  /* ====================================================
     CURRENT TAB
  ==================================================== */

  currentView: OrderView = 'new';


  /* ====================================================
     ORDERS
  ==================================================== */

  newOrders: VendorOrder[] = [];

  confirmedOrders: VendorOrder[] = [];


  /* ====================================================
     SELECTED ORDER
  ==================================================== */

  selectedOrder:
    VendorOrder | null = null;

  showDetails = false;


  /* ====================================================
     LOADING
  ==================================================== */

  isLoading = false;

  confirmingOrderId:
    number | null = null;

  errorMessage = '';


  constructor(

    private vendorOrderService:
      VendorOrderService,

    private cdr:
      ChangeDetectorRef

  ) {

    addIcons({

      receiptOutline,

      cubeOutline,

      calendarOutline,

      callOutline,

      locationOutline,

      checkmarkCircleOutline,

      timeOutline,

      chevronForwardOutline,

      arrowBackOutline,

      closeCircleOutline,

      alertCircleOutline,

      hourglassOutline

    });

  }


  /* ====================================================
     PAGE ENTER
  ==================================================== */

  ionViewWillEnter(): void {

    this.loadOrders();

  }


  /* ====================================================
     LOAD ORDERS
  ==================================================== */

  loadOrders(): void {

    this.loadNewOrders();

    this.loadConfirmedOrders();

  }


  /* ====================================================
     LOAD NEW ORDERS
  ==================================================== */

  loadNewOrders(): void {

    this.isLoading = true;

    this.errorMessage = '';


    this.vendorOrderService
      .getReceivedOrders(
        0,
        10
      )
      .subscribe({

        next: (response) => {

          this.newOrders =
            response?.content ?? [];

          this.isLoading = false;

          this.cdr.detectChanges();

        },


        error: (error) => {

          console.error(
            'GET VENDOR RECEIVED ORDERS ERROR:',
            error
          );

          this.newOrders = [];

          this.isLoading = false;

          this.errorMessage =
            'Unable to load new orders.';

          this.cdr.detectChanges();

        }

      });

  }


  /* ====================================================
     LOAD CONFIRMED ORDERS
  ==================================================== */

  loadConfirmedOrders(): void {

    this.vendorOrderService
      .getConfirmedOrders(
        0,
        1
      )
      .subscribe({

        next: (response) => {

          this.confirmedOrders =
            response?.content ?? [];

          this.cdr.detectChanges();

        },


        error: (error) => {

          console.error(
            'GET VENDOR CONFIRMED ORDERS ERROR:',
            error
          );

          this.confirmedOrders = [];

          this.cdr.detectChanges();

        }

      });

  }


  /* ====================================================
     CHANGE VIEW
  ==================================================== */

  changeView(
    view: OrderView
  ): void {

    this.currentView =
      view;

    this.showDetails = false;

    this.selectedOrder = null;

  }


  /* ====================================================
     GET CURRENT ORDERS
  ==================================================== */

  get currentOrders():
    VendorOrder[] {

    if (
      this.currentView ===
      'confirmed'
    ) {

      return this.confirmedOrders;

    }


    return this.newOrders;

  }


  /* ====================================================
     CONFIRM ORDER
  ==================================================== */

  confirmOrder(
    event: Event,
    order: VendorOrder
  ): void {

    event.stopPropagation();


    if (
      this.confirmingOrderId !== null
    ) {

      return;

    }


    this.confirmingOrderId =
      order.orderId;


    this.vendorOrderService
      .confirmOrder(
        order.orderId
      )
      .subscribe({

        next: () => {

          this.confirmingOrderId =
            null;


          /*
           * Remove from New immediately.
           */

          this.newOrders =
            this.newOrders.filter(
              item =>
                item.orderId !==
                order.orderId
            );


          /*
           * Refresh confirmed orders
           * from backend.
           */

          this.loadConfirmedOrders();

          this.cdr.detectChanges();

        },


        error: (error) => {

          console.error(
            'CONFIRM VENDOR ORDER ERROR:',
            error
          );

          this.confirmingOrderId =
            null;

          this.cdr.detectChanges();

        }

      });

  }


  /* ====================================================
     OPEN ORDER
  ==================================================== */

  openOrder(
    order: VendorOrder
  ): void {

    this.selectedOrder =
      order;

    this.showDetails = true;

  }


  /* ====================================================
     BACK TO ORDERS
  ==================================================== */

  backToOrders(): void {

    this.showDetails = false;

    this.selectedOrder = null;

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


    if (
      isNaN(
        date.getTime()
      )
    ) {

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


    if (
      isNaN(
        date.getTime()
      )
    ) {

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
     TRACK ORDER
  ==================================================== */

  trackOrder(
    index: number,
    order: VendorOrder
  ): number {

    return order.orderId;

  }


  /* ====================================================
     TRACK ITEM
  ==================================================== */

  trackItem(
    index: number,
    item: VendorOrderItem
  ): number {

    return item.orderItemId;

  }

}