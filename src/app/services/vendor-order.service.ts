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

  productId: number;

  productName: string;

  brandName: string | null;

  size: string | null;

  packQuantity: number | null;

  packUnit: string | null;

  storeImageUrl: string | null;

  quantity: number;

  price: number;

  subtotal: number;

}


/* ======================================================
   VENDOR ORDER
====================================================== */

export interface VendorOrder {

  orderId: number;

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
      `${this.apiUrl}/vendor/orders/received`,
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
      `${this.apiUrl}/vendor/orders/confirmed`,
      {
        params
      }
    );

  }


  /* ====================================================
     CONFIRM ORDER
  ==================================================== */

  confirmOrder(
    orderId: number
  ): Observable<any> {

    return this.http.put(
      `${this.apiUrl}/vendor/orders/${orderId}/confirm`,
      {}
    );

  }

}