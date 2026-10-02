import { Injectable } from '@angular/core';

import {
  HttpClient,
  HttpParams
} from '@angular/common/http';

import {
  Observable,
  BehaviorSubject,
  of,
  throwError
} from 'rxjs';

import {
  finalize,
  shareReplay,
  tap
} from 'rxjs/operators';

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
  productImageUrl?: string | null;
  sellingPrice: number;
  quantity: number;
  subtotal: number;
  availableStock: number;
  stockStatus: string;
  categoryName?: string;
  imageUrl?: string;
}


/* ======================================================
   CART STORE
====================================================== */

export interface CartStore {
  storeId: number;
  storeName: string;
  storeImageUrl: string | null;
  items: CartItem[];
  storeSubtotal: number;
}


/* ======================================================
   CART RESPONSE
====================================================== */

export interface CartResponse {
  cartId: number;
  cartToken: string;
  customerMobile: string | null;
  message: string;
  stores: CartStore[];
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
     CART STATE
  ==================================================== */

  private readonly cartSubject =
    new BehaviorSubject<CartResponse | null>(
      null
    );


  readonly cart$ =
    this.cartSubject.asObservable();


  /*
   * Holds the initial cart request while it is running.
   *
   * This prevents:
   *
   * Product Details → getCart()
   * Floating Cart   → getCart()
   * Cart Page       → getCart()
   *
   * from creating three simultaneous HTTP requests.
   */
  private cartRequest$:
    Observable<CartResponse> | null = null;


  constructor(
    private readonly http: HttpClient
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
     UPDATE CENTRAL CART STATE
  ==================================================== */

  private updateCartState(
    response: CartResponse
  ): CartResponse {

    if (response?.cartToken) {

      this.saveCartToken(
        response.cartToken
      );

    }


    this.cartSubject.next(
      response
    );


    return response;

  }


  /* ====================================================
     ADD TO CART
  ==================================================== */

  addToCart(
    productStoreId: number,
    quantity: number
  ): Observable<CartResponse> {

    const body:
      AddCartRequest & {
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


    return this.http
      .post<CartResponse>(
        `${this.apiUrl}/cart/items`,
        body
      )
      .pipe(

        tap(response =>
          this.updateCartState(
            response
          )
        )

      );

  }


  /* ====================================================
     GET CART
  ==================================================== */

  getCart(): Observable<CartResponse> {

    const cartToken =
      this.getCartToken();


    if (!cartToken) {

      return throwError(
        () =>
          new Error(
            'Cart token not found.'
          )
      );

    }


    /*
     * If this cart is already loaded in memory,
     * DO NOT call the backend again.
     *
     * This is the main fix for repeated cart APIs
     * during navigation.
     */
    const currentCart =
      this.cartSubject.getValue();


    if (
      currentCart &&
      currentCart.cartToken === cartToken
    ) {

      return of(
        currentCart
      );

    }


    /*
     * If another component is already loading the cart,
     * share that same request.
     */
    if (this.cartRequest$) {

      return this.cartRequest$;

    }


    this.cartRequest$ =
      this.http
        .get<CartResponse>(
          `${this.apiUrl}/cart/${cartToken}`
        )
        .pipe(

          tap(response =>
            this.updateCartState(
              response
            )
          ),

          finalize(() => {

            this.cartRequest$ =
              null;

          }),

          shareReplay({
            bufferSize: 1,
            refCount: false
          })

        );


    return this.cartRequest$;

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


    return this.http
      .put<CartResponse>(
        `${this.apiUrl}/cart/items/${cartItemId}`,
        body
      )
      .pipe(

        tap(response =>
          this.updateCartState(
            response
          )
        )

      );

  }


  /* ====================================================
     REMOVE CART ITEM
  ==================================================== */

  removeCartItem(
    cartItemId: number
  ): Observable<CartResponse> {

    return this.http
      .delete<CartResponse>(
        `${this.apiUrl}/cart/items/${cartItemId}`
      )
      .pipe(

        tap(response =>
          this.updateCartState(
            response
          )
        )

      );

  }


  /* ====================================================
     CLEAR ENTIRE CART
  ==================================================== */

  clearCart(): Observable<any> {

    const cartToken =
      this.getCartToken();


    if (!cartToken) {

      return of(null);

    }


    return this.http
      .delete(
        `${this.apiUrl}/cart/${cartToken}`
      )
      .pipe(

        tap(() => {

          this.removeCartToken();

          this.cartSubject.next(null);

        })

      );

  }


  /* ====================================================
     CLEAR LOCAL CART
  ==================================================== */

  clearLocalCart(): void {

    this.removeCartToken();

    this.cartSubject.next(null);

  }


  /* ====================================================
     CURRENT CART
  ==================================================== */

  getCurrentCart():
    CartResponse | null {

    return this.cartSubject.getValue();

  }


  /* ====================================================
     CART ITEM COUNT
  ==================================================== */

  getCartItemCount(): number {

    return (
      this.cartSubject.getValue()
        ?.totalItems ?? 0
    );

  }


  /* ====================================================
     CHECK PRODUCT IN CART
  ==================================================== */

  isProductInCart(
    productStoreId: number
  ): boolean {

    const cart =
      this.cartSubject.getValue();


    if (!cart?.stores?.length) {
      return false;
    }


    return cart.stores.some(
      store =>
        store.items?.some(
          item =>
            Number(
              item.productStoreId
            ) ===
            Number(
              productStoreId
            )
        ) ?? false
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

  getCustomerMobile():
    string | null {

    return localStorage.getItem(
      this.CUSTOMER_MOBILE_KEY
    );

  }

}