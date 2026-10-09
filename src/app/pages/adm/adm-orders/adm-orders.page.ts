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
  closeOutline,
  arrowBackOutline
} from 'ionicons/icons';

import {
  OrderService
} from '../../../services/order.service';

import {
  VendorService
} from '../../../services/vendor.service';


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


/* =========================================================
   VENDOR
========================================================= */

export interface AdminOrderVendor {

  userId: number;

  name: string;

  storeName: string;

}


/* =========================================================
   COMPONENT
========================================================= */

@Component({

  selector: 'app-adm-orders',

  standalone: true,

  templateUrl: './adm-orders.page.html',

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
     VENDOR FILTER
  ======================================================= */

  vendors: AdminOrderVendor[] = [];

  selectedVendorId: number | 'ALL' = 'ALL';


  /* =======================================================
     STATE
  ======================================================= */

  isLoading = false;

  errorMessage = '';


  /* =======================================================
     CONSTRUCTOR
  ======================================================= */

  constructor(

    private orderService: OrderService,

    private vendorService: VendorService,

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

      closeOutline,

      arrowBackOutline

    });

  }


  /* =======================================================
     INIT
  ======================================================= */

  ngOnInit(): void {

    this.loadVendors();

    this.loadOrders();

  }


  /* =======================================================
     LOAD VENDORS
  ======================================================= */

  loadVendors(): void {

    this.vendorService
      .getAllVendors(0, 100)
      .subscribe({

        next: (response: any) => {

          this.vendors =
            response?.vendors || [];

          this.cdr.detectChanges();

        },

        error: (error) => {

          console.error(
            'Admin Vendors Error:',
            error
          );

          this.vendors = [];

          this.cdr.detectChanges();

        }

      });

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

        next: (
          response: AdminOrderPageResponse
        ) => {

          console.log(
            'Admin Orders Response:',
            response
          );


          this.orders =
            response?.content || [];


          this.applyVendorFilter();


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
     VENDOR FILTER CHANGED
  ======================================================= */

  onVendorChanged(): void {

    this.applyVendorFilter();

  }


  /* =======================================================
     APPLY VENDOR FILTER
  ======================================================= */

  applyVendorFilter(): void {

    /*
     * Show every order when
     * "All Vendors" is selected.
     */

    if (
      this.selectedVendorId === 'ALL'
    ) {

      this.filteredOrders = [
        ...this.orders
      ];

      return;

    }


    /*
     * An order can contain products
     * from multiple vendors.
     *
     * Therefore, show the order when
     * at least one order item belongs
     * to the selected vendor.
     */

    this.filteredOrders =

      this.orders.filter(

        order =>

          order.items?.some(

            item =>

              item.vendorId ===
              this.selectedVendorId

          )

      );

  }


  /* =======================================================
     OPEN ORDER DETAILS
  ======================================================= */

  openOrder(
    order: AdminOrder
  ): void {

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

      .replace(/\_/g, ' ')

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


    if (
      Number.isNaN(
        parsedDate.getTime()
      )
    ) {

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


    if (
      Number.isNaN(
        parsedDate.getTime()
      )
    ) {

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
     ORDER VENDORS
  ======================================================= */

  getOrderVendors(
    order: AdminOrder
  ): string {

    if (
      !order?.items?.length
    ) {

      return '';

    }


    const vendorNames = [

      ...new Set(

        order.items

          .map(
            item => item.vendorName
          )

          .filter(

            (
              name
            ): name is string =>

              !!name?.trim()

          )

      )

    ];


    return vendorNames.join(
      ' • '
    );

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


  /* =======================================================
     GO BACK
  ======================================================= */

  goBack(): void {

    window.history.back();

  }

getOrderImages(order: AdminOrder): string[] {
  return (order?.items || [])
    .map(item => item.productImageUrl)
    .filter((url): url is string => !!url);
}


onOrderImageError(
  event: Event,
  order: AdminOrder
): void {
  const img = event.target as HTMLImageElement;

  console.error('ORDER IMAGE FAILED', {
    orderId: order.orderId,
    productId: order.items?.[0]?.productId,
    url: order.items?.[0]?.productImageUrl
  });
}

}