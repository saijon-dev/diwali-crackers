import {
  Component,
  OnInit,
  ChangeDetectorRef
} from '@angular/core';

import {
  FormsModule
} from '@angular/forms';

import {
  IonContent,
  IonIcon,
  IonModal,
  IonButton,
  IonInput,
  IonTextarea,
  IonAlert,
  IonToast,
  AlertController
} from '@ionic/angular';

import {
  Router
} from '@angular/router';

import {
  addIcons
} from 'ionicons';

import {
  arrowBackOutline,
  removeOutline,
  addOutline,
  trashOutline,
  cartOutline,
  imageOutline,
  chevronForwardOutline,
  closeOutline
} from 'ionicons/icons';

import {
  CartService,
  CartItem,
  CreateOrderRequest,
  OrderResponse
} from '../../services/cart.service';


@Component({
  selector: 'app-cart',
  templateUrl: './cart.page.html',
  styleUrls: ['./cart.page.scss'],
  standalone: true,
  imports: [
    FormsModule,
    IonContent,
    IonIcon,
    IonModal,
    IonButton,
    IonInput,
    IonTextarea,
    IonAlert,
    IonToast
  ]
})
export class CartPage implements OnInit {


  /* ====================================================
     LOADING
  ==================================================== */

  isLoading = false;


  /* ====================================================
     ERROR
  ==================================================== */

  errorMessage = '';


  /* ====================================================
     CART ITEMS
  ==================================================== */

  cartItems: CartItem[] = [];


  /* ====================================================
     CART TOKEN
  ==================================================== */

  cartToken = '';


  /* ====================================================
     BILLING
  ==================================================== */

  discount = 0;

  deliveryCharge = 0;

  subtotal = 0;


  /* ====================================================
     CLEAR CART
  ==================================================== */

  isClearingCart = false;


  /* ====================================================
     CHECKOUT MODAL
  ==================================================== */

  isCheckoutModalOpen = false;


  /* ====================================================
     CHECKOUT DETAILS
  ==================================================== */

  customerName = '';

  customerMobile = '';

  deliveryAddress = '';


  /* ====================================================
     ORDER
  ==================================================== */

  isCreatingOrder = false;

  createdOrder: OrderResponse | null = null;


  /* ====================================================
     TOAST
  ==================================================== */

  isToastOpen = false;

  toastMessage = '';

  toastColor:
    'success' |
    'danger' |
    'warning' |
    'primary' = 'success';


  constructor(
    private router: Router,
    private cdr: ChangeDetectorRef,
    private cartService: CartService,
      private alertController: AlertController
  ) {

    addIcons({

      arrowBackOutline,

      removeOutline,

      addOutline,

      trashOutline,

      cartOutline,

      imageOutline,

      chevronForwardOutline,

      closeOutline

    });

  }


  /* ====================================================
     INIT
  ==================================================== */

  ngOnInit(): void {

    this.loadCart();

  }


  /* ====================================================
     LOAD CART
  ==================================================== */

  loadCart(): void {

    const token =
      this.cartService.getCartToken();


    if (!token) {

      this.cartItems = [];

      this.cartToken = '';

      this.calculateTotals();

      return;

    }


    this.isLoading = true;

    this.errorMessage = '';


    this.cartService
      .getCart()
      .subscribe({

        next: (response) => {

          console.log(
            'Cart Response:',
            response
          );


          this.cartToken =
            response.cartToken || '';


          this.cartItems =
            response.items || [];


          this.subtotal =
            response.subtotal || 0;


          this.isLoading = false;

          this.calculateTotals();

          this.cdr.detectChanges();

        },


        error: (error) => {

          console.error(
            'Get Cart Error:',
            error
          );


          this.cartItems = [];

          this.isLoading = false;

          this.errorMessage =
            error?.error?.message ||
            error?.message ||
            'Unable to load cart.';

          this.cdr.detectChanges();

        }

      });

  }


  /* ====================================================
     CART ITEM COUNT
  ==================================================== */

  get totalItems(): number {

    return this.cartItems.reduce(
      (total, item) =>
        total + item.quantity,
      0
    );

  }


  /* ====================================================
     ITEM TOTAL
  ==================================================== */

  getItemTotal(
    item: CartItem
  ): number {

    return (
      item.sellingPrice *
      item.quantity
    );

  }


  /* ====================================================
     SUBTOTAL
  ==================================================== */

  get calculatedSubtotal(): number {

    return this.cartItems.reduce(
      (total, item) =>
        total + this.getItemTotal(item),
      0
    );

  }


  /* ====================================================
     GRAND TOTAL
  ==================================================== */

  get grandTotal(): number {

    return Math.max(
      0,
      this.calculatedSubtotal -
      this.discount +
      this.deliveryCharge
    );

  }


  /* ====================================================
     CALCULATE TOTALS
  ==================================================== */

  calculateTotals(): void {

    this.subtotal =
      this.calculatedSubtotal;

    this.cdr.detectChanges();

  }


  /* ====================================================
     INCREASE QUANTITY
  ==================================================== */

  increaseQuantity(
    item: CartItem
  ): void {

    if (
      item.quantity >=
      item.availableStock
    ) {

      return;

    }


    const newQuantity =
      item.quantity + 1;


    this.updateQuantity(
      item,
      newQuantity
    );

  }


  /* ====================================================
     DECREASE QUANTITY
  ==================================================== */

  decreaseQuantity(
    item: CartItem
  ): void {

    if (
      item.quantity <= 1
    ) {

      return;

    }


    const newQuantity =
      item.quantity - 1;


    this.updateQuantity(
      item,
      newQuantity
    );

  }


  /* ====================================================
     UPDATE QUANTITY
  ==================================================== */

  private updateQuantity(
    item: CartItem,
    quantity: number
  ): void {

    this.isLoading = true;

    this.errorMessage = '';


    this.cartService
      .updateCartItem(
        item.cartItemId,
        quantity
      )
      .subscribe({

        next: (response) => {

          console.log(
            'Updated Cart:',
            response
          );


          this.cartItems =
            response.items || [];


          this.isLoading = false;

          this.calculateTotals();

          this.cdr.detectChanges();

        },


        error: (error) => {

          console.error(
            'Update Cart Error:',
            error
          );


          this.isLoading = false;

          this.errorMessage =
            error?.error?.message ||
            error?.message ||
            'Unable to update quantity.';

          this.cdr.detectChanges();

        }

      });

  }


  /* ====================================================
     REMOVE ITEM
  ==================================================== */

  removeItem(
    item: CartItem
  ): void {

    this.isLoading = true;

    this.errorMessage = '';


    this.cartService
      .removeCartItem(
        item.cartItemId
      )
      .subscribe({

        next: (response) => {

          console.log(
            'Removed Cart Item:',
            response
          );


          this.cartItems =
            response?.items || [];


          this.isLoading = false;

          this.calculateTotals();

          this.cdr.detectChanges();

        },


        error: (error) => {

          console.error(
            'Remove Cart Item Error:',
            error
          );


          this.isLoading = false;

          this.errorMessage =
            error?.error?.message ||
            error?.message ||
            'Unable to remove item.';

          this.cdr.detectChanges();

        }

      });

  }


  /* ====================================================
     CLEAR ENTIRE CART
  ==================================================== */

  async clearCart(): Promise<void> {

    if (
      this.cartItems.length === 0 ||
      this.isClearingCart
    ) {

      return;

    }


    const alert =
      await this.createConfirmAlert(
        'Clear Cart',
        'Are you sure you want to remove all items from your cart?',
        'Clear Cart',
        () => {

          this.performClearCart();

        }
      );


    await alert.present();

  }


  /* ====================================================
     CLEAR CART API
  ==================================================== */

  private performClearCart(): void {

    this.isClearingCart = true;

    this.isLoading = true;

    this.errorMessage = '';


    this.cartService
      .clearCart()
      .subscribe({

        next: (response) => {

          console.log(
            'Clear Cart Response:',
            response
          );


          this.cartItems = [];

          this.cartToken = '';

          this.isClearingCart = false;

          this.isLoading = false;

          this.calculateTotals();

          this.cdr.detectChanges();

        },


        error: (error) => {

          console.error(
            'Clear Cart Error:',
            error
          );


          this.isClearingCart = false;

          this.isLoading = false;

          this.errorMessage =
            error?.error?.message ||
            error?.message ||
            'Unable to clear cart.';

          this.showToast(
            this.errorMessage,
            'danger'
          );

          this.cdr.detectChanges();

        }

      });

  }


  /* ====================================================
     CONTINUE TO CHECKOUT
  ==================================================== */

  continueToCheckout(): void {

    if (
      this.cartItems.length === 0
    ) {

      return;

    }


    this.errorMessage = '';

    this.isCheckoutModalOpen = true;

  }


  /* ====================================================
     CLOSE CHECKOUT MODAL
  ==================================================== */

  closeCheckoutModal(): void {

    if (this.isCreatingOrder) {

      return;

    }


    this.isCheckoutModalOpen = false;

  }


  /* ====================================================
     MAKE ORDER
  ==================================================== */

  async makeOrder(): Promise<void> {

    if (this.isCreatingOrder) {

      return;

    }


    /* ==================================================
       NAME
    ================================================== */

    if (
      !this.customerName.trim()
    ) {

      this.showToast(
        'Please enter your name.',
        'warning'
      );

      return;

    }


    /* ==================================================
       MOBILE
    ================================================== */

    const mobile =
      this.customerMobile.trim();


    if (!mobile) {

      this.showToast(
        'Please enter your mobile number.',
        'warning'
      );

      return;

    }


    if (!/^\d{10}$/.test(mobile)) {

      this.showToast(
        'Please enter a valid 10-digit mobile number.',
        'warning'
      );

      return;

    }


    /* ==================================================
       ADDRESS
    ================================================== */

    if (
      !this.deliveryAddress.trim()
    ) {

      this.showToast(
        'Please enter your delivery address.',
        'warning'
      );

      return;

    }


    /* ==================================================
       CART TOKEN
    ================================================== */

    const token =
      this.cartService.getCartToken();


    if (!token) {

      this.showToast(
        'Your cart session could not be found.',
        'danger'
      );

      return;

    }


    /* ==================================================
       CLOSE MODAL
    ================================================== */

    this.isCheckoutModalOpen = false;


    /* ==================================================
       CONFIRM ORDER
    ================================================== */

    const alert =
      await this.createConfirmAlert(
        'Confirm Order',
        'Are you sure you want to place this order?',
        'Order',
        () => {

          this.placeOrder(token);

        }
      );


    await alert.present();

  }


  /* ====================================================
     PLACE ORDER
  ==================================================== */

  private placeOrder(
    token: string
  ): void {

    this.isCreatingOrder = true;

    this.errorMessage = '';


    const orderData:
      CreateOrderRequest = {

      cartToken: token,

      customerName:
        this.customerName.trim(),

      customerMobile:
        this.customerMobile.trim(),

      deliveryAddress:
        this.deliveryAddress.trim()

    };


    console.log(
      'Create Order Request:',
      orderData
    );


    this.cartService
      .createOrder(
        orderData
      )
      .subscribe({

        next: (response) => {

          console.log(
            'Order Created:',
            response
          );


          this.createdOrder =
            response;


          this.isCreatingOrder = false;


          /*
           * Clear the local cart immediately.
           *
           * This updates:
           * - CartPage
           * - Cart badge
           * - CartService
           *
           * without making another DELETE request.
           */

this.cartService.saveCustomerMobile(
  this.customerMobile.trim()
);




          this.cartService
            .clearLocalCart();


          this.cartItems = [];

          this.cartToken = '';

          this.calculateTotals();


          /*
           * Reset checkout fields.
           */

          this.customerName = '';

          this.customerMobile = '';

          this.deliveryAddress = '';


          this.cdr.detectChanges();


          /*
           * Show Ionic toast.
           */

          this.showToast(
            `Order #${response.orderId} placed successfully.`,
            'success'
          );


          /*
           * Navigate to Orders page.
           *
           * Create /tabs/orders next.
           */

          setTimeout(() => {

            this.router.navigate([
              '/tabs/orders'
            ]);

          }, 900);

        },


        error: (error) => {

          console.error(
            'Create Order Error:',
            error
          );


          this.isCreatingOrder = false;


          const message =
            error?.error?.message ||
            error?.message ||
            'Unable to place the order. Please try again.';


          this.showToast(
            message,
            'danger'
          );


          this.cdr.detectChanges();

        }

      });

  }


  /* ====================================================
     CREATE IONIC CONFIRM ALERT
  ==================================================== */

  private async createConfirmAlert(
    header: string,
    message: string,
    confirmText: string,
    confirmHandler: () => void
  ): Promise<HTMLIonAlertElement> {

    return this.alertController.create({

      header,

      message,

      cssClass:
        'diwali-confirm-alert',

      buttons: [

        {
          text: 'Cancel',

          role: 'cancel'

        },

        {
          text: confirmText,

          role: 'confirm',

          handler: confirmHandler

        }

      ]

    });

  }


  /* ====================================================
     TOAST
  ==================================================== */

  showToast(
    message: string,
    color:
      'success' |
      'danger' |
      'warning' |
      'primary'
  ): void {

    this.toastMessage =
      message;

    this.toastColor =
      color;

    this.isToastOpen = false;


    setTimeout(() => {

      this.isToastOpen = true;

      this.cdr.detectChanges();

    }, 10);

  }


  /* ====================================================
     CONTINUE SHOPPING
  ==================================================== */

  continueShopping(): void {

    this.router.navigate([
      '/tabs/home'
    ]);

  }


  /* ====================================================
     BACK
  ==================================================== */

  goBack(): void {

    this.router.navigate([
      '/tabs/home'
    ]);

  }

}