import { Injectable } from '@angular/core';

import {
  HttpClient,
  HttpParams
} from '@angular/common/http';

import {
  Observable,
  BehaviorSubject
} from 'rxjs';

import { environment } from '../../environments/environment';


/* ======================================================
   CART ITEM
====================================================== */

export interface CartItem {

  cartItemId: number;

  productStoreId: number;

  productId: number;

  productName: string;

  vendorName: string;

  brandName: string;

  size: string;

  packQuantity: number;

  packUnit: string;

  storeImageUrl?: string | null;

  sellingPrice: number;

  quantity: number;

  subtotal: number;

  availableStock: number;

  stockStatus: string;

  categoryName?: string;

  imageUrl?: string;

}


/* ======================================================
   CART RESPONSE
====================================================== */

export interface CartResponse {

  cartId: number;

  cartToken: string;

  customerMobile: string | null;

  message: string;

  items: CartItem[];

  totalItems: number;

  subtotal: number;

}


/* ======================================================
   ADD CART REQUEST
====================================================== */

export interface AddCartRequest {

  productStoreId: number;

  quantity: number;

}


/* ======================================================
   UPDATE CART REQUEST
====================================================== */

export interface UpdateCartRequest {

  quantity: number;

}


/* ======================================================
   CREATE ORDER REQUEST
====================================================== */

export interface CreateOrderRequest {

  cartToken: string;

  customerName: string;

  customerMobile: string;

  deliveryAddress: string;

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

  brandName: string;

  size: string;

  packQuantity: number;

  packUnit: string;

  storeImageUrl: string | null;

  quantity: number;

  price: number;

  subtotal: number;

}


/* ======================================================
   ORDER RESPONSE
====================================================== */

export interface OrderResponse {

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
   SERVICE
====================================================== */

@Injectable({
  providedIn: 'root'
})
export class CartService {

  private readonly apiUrl =
    environment.apiUrl;


  private readonly CART_TOKEN_KEY =
    'diwali_cart_token';


    private readonly CUSTOMER_MOBILE_KEY =
  'diwali_customer_mobile';


  /* ====================================================
     CART SUBJECT
  ==================================================== */

  private cartSubject =
    new BehaviorSubject<CartResponse | null>(null);


  cart$ =
    this.cartSubject.asObservable();


  constructor(
    private http: HttpClient
  ) {}


  /* ====================================================
     GET CART TOKEN
  ==================================================== */

  getCartToken(): string | null {

    return localStorage.getItem(
      this.CART_TOKEN_KEY
    );

  }


  /* ====================================================
     SAVE CART TOKEN
  ==================================================== */

  private saveCartToken(
    token: string
  ): void {

    localStorage.setItem(
      this.CART_TOKEN_KEY,
      token
    );

  }


  /* ====================================================
     REMOVE CART TOKEN
  ==================================================== */

  private removeCartToken(): void {

    localStorage.removeItem(
      this.CART_TOKEN_KEY
    );

  }


  /* ====================================================
     ADD TO CART
  ==================================================== */

  addToCart(
    productStoreId: number,
    quantity: number
  ): Observable<CartResponse> {

    const body: AddCartRequest & {
      cartToken?: string;
    } = {

      productStoreId,

      quantity

    };


    const cartToken =
      this.getCartToken();


    if (cartToken) {

      body.cartToken =
        cartToken;

    }


    return new Observable<CartResponse>(
      observer => {

        this.http
          .post<CartResponse>(
            `${this.apiUrl}/cart/items`,
            body
          )
          .subscribe({

            next: (response) => {

              if (response.cartToken) {

                this.saveCartToken(
                  response.cartToken
                );

              }


              this.cartSubject.next(
                response
              );


              observer.next(
                response
              );

              observer.complete();

            },


            error: (error) => {

              observer.error(
                error
              );

            }

          });

      }
    );

  }


  /* ====================================================
     GET CART
  ==================================================== */

  getCart(): Observable<CartResponse> {

    const cartToken =
      this.getCartToken();


    if (!cartToken) {

      return new Observable<CartResponse>(
        observer => {

          observer.error(
            new Error(
              'Cart token not found.'
            )
          );

        }
      );

    }


    return new Observable<CartResponse>(
      observer => {

        this.http
          .get<CartResponse>(
            `${this.apiUrl}/cart/${cartToken}`
          )
          .subscribe({

            next: (response) => {

              if (response.cartToken) {

                this.saveCartToken(
                  response.cartToken
                );

              }


              this.cartSubject.next(
                response
              );


              observer.next(
                response
              );

              observer.complete();

            },


            error: (error) => {

              observer.error(
                error
              );

            }

          });

      }
    );

  }


  /* ====================================================
     UPDATE CART ITEM
  ==================================================== */

  updateCartItem(
    cartItemId: number,
    quantity: number
  ): Observable<CartResponse> {

    const body:
      UpdateCartRequest = {

      quantity

    };


    return new Observable<CartResponse>(
      observer => {

        this.http
          .put<CartResponse>(
            `${this.apiUrl}/cart/items/${cartItemId}`,
            body
          )
          .subscribe({

            next: (response) => {

              this.cartSubject.next(
                response
              );


              observer.next(
                response
              );

              observer.complete();

            },


            error: (error) => {

              observer.error(
                error
              );

            }

          });

      }
    );

  }


  /* ====================================================
     REMOVE CART ITEM
  ==================================================== */

  removeCartItem(
    cartItemId: number
  ): Observable<CartResponse> {

    return new Observable<CartResponse>(
      observer => {

        this.http
          .delete<CartResponse>(
            `${this.apiUrl}/cart/items/${cartItemId}`
          )
          .subscribe({

            next: (response) => {

              this.cartSubject.next(
                response
              );


              observer.next(
                response
              );

              observer.complete();

            },


            error: (error) => {

              observer.error(
                error
              );

            }

          });

      }
    );

  }


  /* ====================================================
     CLEAR CART API
  ==================================================== */

  clearCart(): Observable<any> {

    const cartToken =
      this.getCartToken();


    if (!cartToken) {

      return new Observable<any>(
        observer => {

          observer.next(null);

          observer.complete();

        }
      );

    }


    return new Observable<any>(
      observer => {

        this.http
          .delete(
            `${this.apiUrl}/cart/${cartToken}`
          )
          .subscribe({

            next: (response) => {

              this.removeCartToken();

              this.cartSubject.next(null);


              observer.next(
                response
              );

              observer.complete();

            },


            error: (error) => {

              observer.error(
                error
              );

            }

          });

      }
    );

  }


  /* ====================================================
     CLEAR LOCAL CART
     
     Used after successful order creation.
     Does NOT make another API request.
  ==================================================== */

  clearLocalCart(): void {

    this.removeCartToken();

    this.cartSubject.next(null);

  }


  /* ====================================================
     CURRENT CART
  ==================================================== */

  getCurrentCart(): CartResponse | null {

    return this.cartSubject.value;

  }


  /* ====================================================
     CART ITEM COUNT
  ==================================================== */

  getCartItemCount(): number {

    return (
      this.cartSubject.value?.totalItems ||
      0
    );

  }


  /* ====================================================
     CHECK PRODUCT IN CART
  ==================================================== */

  isProductInCart(
    productStoreId: number
  ): boolean {

    const cart =
      this.cartSubject.value;


    if (!cart) {

      return false;

    }


    return cart.items.some(
      item =>
        item.productStoreId ===
        productStoreId
    );

  }


  /* ====================================================
     CREATE ORDER
  ==================================================== */

  createOrder(
    orderData: CreateOrderRequest
  ): Observable<OrderResponse> {

    return this.http.post<OrderResponse>(
      `${this.apiUrl}/orders`,
      orderData
    );

  }


  /* ====================================================
     GET ORDER
  ==================================================== */

  getOrder(
    orderId: number,
    customerMobile: string
  ): Observable<OrderResponse> {

    const params =
      new HttpParams()
        .set(
          'customerMobile',
          customerMobile
        );


    return this.http.get<OrderResponse>(
      `${this.apiUrl}/orders/${orderId}`,
      {
        params
      }
    );

  }





  /* ====================================================
   SAVE CUSTOMER MOBILE
==================================================== */

saveCustomerMobile(
  mobile: string
): void {

  localStorage.setItem(
    this.CUSTOMER_MOBILE_KEY,
    mobile.trim()
  );

}


/* ====================================================
   GET CUSTOMER MOBILE
==================================================== */

getCustomerMobile(): string | null {

  return localStorage.getItem(
    this.CUSTOMER_MOBILE_KEY
  );

}

}