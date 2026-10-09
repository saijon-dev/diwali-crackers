import { Injectable } from '@angular/core';

import {
  HttpClient,
  HttpParams
} from '@angular/common/http';

import {
  Observable
} from 'rxjs';

import { environment } from '../../environments/environment';


/* ======================================================
   VENDOR ORDER ITEM
====================================================== */

export interface VendorOrderItem {

  orderItemId: number;

  orderStoreId?: number;

  productId: number;

  productName: string;

  brandName: string | null;

  size: string | null;

  packQuantity: number | null;

  packUnit: string | null;

  productImageUrl: string | null;

  quantity: number;

  price: number;

  subtotal: number;

}


/* ======================================================
   VENDOR ORDER
====================================================== */

export interface VendorOrder {

  orderId: number;

    orderStoreId?: number;

  customerName: string;

  customerMobile: string;

  deliveryAddress: string;

  vendorTotalAmount: number;

  paymentMethod: string;

  status: string;

  vendorStatus: string;

  expectedDeliveryDate: string;

  createdAt: string;

  items: VendorOrderItem[];

}


/* ======================================================
   PAGINATED VENDOR ORDERS
====================================================== */

export interface VendorOrderPageResponse {

  content: VendorOrder[];

  empty: boolean;

  first: boolean;

  last: boolean;

  number: number;

  numberOfElements: number;

  size: number;

  totalElements: number;

  totalPages: number;

}


/* ======================================================
   SERVICE
====================================================== */

@Injectable({
  providedIn: 'root'
})
export class VendorOrderService {

  private readonly apiUrl =
    environment.apiUrl;


  constructor(
    private http: HttpClient
  ) {}


  /* ====================================================
     GET NEW / RECEIVED ORDERS
  ==================================================== */

  getReceivedOrders(
    page: number = 0,
    size: number = 10
  ): Observable<VendorOrderPageResponse> {

    const params =
      new HttpParams()
        .set(
          'page',
          page
        )
        .set(
          'size',
          size
        );


    return this.http.get<VendorOrderPageResponse>(
      `${this.apiUrl}/orders/vendor/received`,
      {
        params
      }
    );

  }


  /* ====================================================
     GET CONFIRMED ORDERS
  ==================================================== */

  getConfirmedOrders(
    page: number = 0,
    size: number = 1
  ): Observable<VendorOrderPageResponse> {

    const params =
      new HttpParams()
        .set(
          'page',
          page
        )
        .set(
          'size',
          size
        );


    return this.http.get<VendorOrderPageResponse>(
      `${this.apiUrl}/orders/vendor/all`,
      {
        params
      }
    );

  }


  /* ====================================================
     CONFIRM ORDER
  ==================================================== */
  /* ====================================================
     UPDATE VENDOR ORDER STATUS
  ==================================================== */

  updateOrderStatus(
    orderId: number,
    status: string
  ): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/orders/${orderId}/vendor/status`,
      { status }
    );
  }

  /* ====================================================
     CONFIRM ORDER — BACKWARD COMPATIBILITY
  ==================================================== */

  confirmOrder(orderId: number): Observable<any> {
    return this.updateOrderStatus(orderId, 'CONFIRMED');
  }


  /* ====================================================
   VERIFY DELIVERY OTP
==================================================== */

verifyDeliveryOtp(
  orderId: number,
  customerMobile: string,
  otp: string,
  orderStoreId: number
): Observable<any> {
  const params = new HttpParams()
    .set('customerMobile', customerMobile);

  return this.http.post(
    `${this.apiUrl}/orders/${orderId}/verify-delivery-otp`,
    { otp, orderStoreId },
    { params }
  );
}

}