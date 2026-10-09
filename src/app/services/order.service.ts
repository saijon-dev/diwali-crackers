import { Injectable } from '@angular/core';

import {
  HttpClient,
  HttpParams
} from '@angular/common/http';

import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';






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


/* ======================================================
   ORDER ITEM
====================================================== */

export interface OrderItem {

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


/* ======================================================
   ORDER
====================================================== */

export interface Order {

  orderId: number;

  customerName: string;

  customerMobile: string;

  deliveryAddress: string;

  totalAmount: number;

  paymentMethod: string;

  status: string;

  expectedDeliveryDate: string;

  createdAt: string;

  items: OrderItem[];

}


/* ======================================================
   CUSTOMER ORDERS PAGE RESPONSE
====================================================== */

export interface OrderPageResponse {

  content: Order[];

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
   ORDER HISTORY
====================================================== */

export interface OrderHistory {

  status: string;

  changedAt: string;

  changedBy: string;

}


/* ======================================================
   SERVICE
====================================================== */

@Injectable({
  providedIn: 'root'
})
export class OrderService {

  private readonly apiUrl =
    environment.apiUrl;


  constructor(
    private http: HttpClient
  ) {}









  getAdminOrders(
  page: number = 0,
  size: number = 10
): Observable<AdminOrderPageResponse> {

  const params = new HttpParams()
    .set('page', page)
    .set('size', size);

  return this.http.get<AdminOrderPageResponse>(
    `${this.apiUrl}/orders/admin`,
    {
      params
    }
  );

}

  /* ====================================================
     GET ALL CUSTOMER ORDERS
  ==================================================== */
getCustomerOrders(
  customerMobile: string
): Observable<OrderPageResponse> {

  return this.http.get<OrderPageResponse>(
    `${this.apiUrl}/orders/customer/${customerMobile}`
  );

}


  /* ====================================================
     GET ORDER DETAILS
  ==================================================== */

  getOrderDetails(
    orderId: number,
    customerMobile: string
  ): Observable<Order> {

    const params =
      new HttpParams()
        .set(
          'customerMobile',
          customerMobile
        );


    return this.http.get<Order>(
      `${this.apiUrl}/orders/${orderId}`,
      {
        params
      }
    );

  }


  /* ====================================================
     GET ORDER HISTORY
  ==================================================== */

  getOrderHistory(
    orderId: number,
    customerMobile: string
  ): Observable<OrderHistory[]> {

    const params =
      new HttpParams()
        .set(
          'customerMobile',
          customerMobile
        );


    return this.http.get<OrderHistory[]>(
      `${this.apiUrl}/orders/${orderId}/history`,
      {
        params
      }
    );

  }

}