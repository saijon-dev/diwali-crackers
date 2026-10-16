import {
  Component,
  OnInit,
  ChangeDetectorRef
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';


import {
  LocationService
} from '../../services/location.service';

import {
  LocationStateService
} from '../../services/location-state.service';

import {
  IonContent,
  IonIcon,
  IonModal,
  IonButton,
  IonInput,
  IonTextarea,
  IonAlert,
  IonToast,
  AlertController,
  IonRefresher,
  IonRefresherContent
} from '@ionic/angular';

import { DecimalPipe } from '@angular/common';

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
  closeOutline,
  homeOutline,
  storefrontOutline,
  checkmarkOutline
} from 'ionicons/icons';

import {
  CartService,
  CartItem,
  CartStore,
  CreateOrderRequest,
  OrderResponse
} from '../../services/cart.service';

import {
  FloatingCartComponent
} from '../../components/floating-cart/floating-cart.component';
import { Product } from '../../services/product.service';


@Component({
  selector: 'app-cart',
  templateUrl: './cart.page.html',

  standalone: true,

  imports: [
ReactiveFormsModule,
    IonContent,
    IonIcon,
    IonModal,
    IonButton,
    IonInput,
    IonTextarea,
    IonAlert,
    IonToast,
    FloatingCartComponent,
    DecimalPipe,
    IonRefresher,
    IonRefresherContent
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
     CART STORES

     Products are already separated by
     vendor/store by the backend.
  ==================================================== */

  cartStores: CartStore[] = [];


  /* ====================================================
     CART ITEMS

     Flattened list used only for
     compatibility with totals and
     existing checkout logic.
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
  showOrderConfirmation = false;


  /* ====================================================
     CHECKOUT DETAILS
  ==================================================== */

checkoutForm = new FormGroup({
  customerName: new FormControl('', {
    nonNullable: true,
    validators: [
      Validators.required,
      Validators.pattern(/^[A-Za-zÀ-ÖØ-öø-ÿ\s.'-]+$/),
      Validators.maxLength(80)
    ]
  }),

  customerMobile: new FormControl('', {
    nonNullable: true,
    validators: [
      Validators.required,
      Validators.pattern(/^[0-9]{10}$/)
    ]
  }),

  alternativeMobileNumber: new FormControl('', {
    nonNullable: true,
    validators: [
      Validators.required,
      Validators.pattern(/^[0-9]{10}$/)
    ]
  }),

  deliveryAddress: new FormControl('', {
    nonNullable: true,
    validators: [
      Validators.required,
      Validators.minLength(10),
      Validators.maxLength(300)
    ]
  })
});

isResolvingAddress = false;

  /* ====================================================
     ORDER
  ==================================================== */

  isCreatingOrder = false;

  isCheckoutScreen = false;

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
    private alertController: AlertController,
    private locationService: LocationService,
private locationStateService: LocationStateService
  ) {

    addIcons({

      arrowBackOutline,
      removeOutline,
      addOutline,
      trashOutline,
      cartOutline,
      imageOutline,
      chevronForwardOutline,
      closeOutline,
      homeOutline,
      storefrontOutline,
      checkmarkOutline

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

loadCart(refresher?: any): void {
  const token = this.cartService.getCartToken();

  if (!token) {
    this.cartStores = [];
    this.cartItems = [];
    this.cartToken = '';

    this.calculateTotals();
    this.completeRefresher(refresher);
    return;
  }

  this.isLoading = true;
  this.errorMessage = '';

  this.cartService.getCart().subscribe({
    next: (response) => {
      this.cartToken = response.cartToken || '';
      this.cartStores = response.stores ?? [];

      this.cartItems = this.flattenStoreItems(
        this.cartStores
      );

      this.subtotal = response.subtotal || 0;

      this.isLoading = false;
      this.errorMessage = '';

      this.calculateTotals();
      this.cdr.detectChanges();

      this.completeRefresher(refresher);
    },

    error: (error) => {
      console.error('Get Cart Error:', error);

      this.cartStores = [];
      this.cartItems = [];

      this.isLoading = false;
      this.errorMessage =
        error?.error?.message ||
        error?.message ||
        'Unable to load cart.';

      this.cdr.detectChanges();

      this.completeRefresher(refresher);
    }
  });
}

private completeRefresher(refresher?: any): void {
  const target = refresher?.target;

  if (target && typeof target.complete === 'function') {
    void target.complete();
  }
}



  /* ====================================================
     FLATTEN STORE ITEMS

     Used only internally for totals.
  ==================================================== */

  private flattenStoreItems(
    stores: CartStore[]
  ): CartItem[] {

    return stores.reduce(
      (
        items: CartItem[],
        store: CartStore
      ) => {

        if (store.items?.length) {

          items.push(
            ...store.items
          );

        }

        return items;

      },
      []
    );

  }


  /* ====================================================
     TOTAL STORES
  ==================================================== */

  get totalStores(): number {

    return this.cartStores.length;

  }


  /* ====================================================
     TOTAL ITEMS
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
      this.isLoading ||
      item.quantity >= item.availableStock
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
      this.isLoading ||
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

     PUT:

     /cart/items/{cartItemId}

     {
       "quantity": 5
     }
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


          /*
           * Backend returns the complete
           * new stores[] structure.
           */

          this.cartStores =
            response.stores ?? [];


          this.cartItems =
            this.flattenStoreItems(
              this.cartStores
            );


          this.cartToken =
            response.cartToken || this.cartToken;


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


          this.cartStores =
            response?.stores ?? [];


          this.cartItems =
            this.flattenStoreItems(
              this.cartStores
            );


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


          this.cartStores = [];

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
async continueToCheckout(): Promise<void> {
  if (this.cartItems.length === 0 || this.isLoading) {
    return;
  }

  this.errorMessage = '';
  this.isCheckoutScreen = true;

  // await this.loadDeliveryAddressFromGps();
}


async loadDeliveryAddressFromGps(): Promise<void> {
  if (this.isResolvingAddress) {
    return;
  }

  this.isResolvingAddress = true;
  this.cdr.detectChanges();

  try {
    // Get the customer's actual GPS coordinates.
    const location =
      await this.locationService.getCurrentLocation();

    // Convert latitude and longitude into an address.
    const address =
      await this.locationStateService.reverseGeocode(
        location.latitude,
        location.longitude
      );

    // Populate the checkout address field.
this.checkoutForm.controls.deliveryAddress.setValue(address);

    console.log('GPS Coordinates:', {
      latitude: location.latitude,
      longitude: location.longitude
    });

    console.log('Resolved Delivery Address:', address);
  } catch (error) {
    console.error('Address Lookup Error:', error);

    this.showToast(
      'Unable to detect your address. Please enter it manually.',
      'warning'
    );
  } finally {
    this.isResolvingAddress = false;
    this.cdr.detectChanges();
  }
}


  /* ====================================================
     CLOSE CHECKOUT MODAL
  ==================================================== */

closeCheckoutModal(): void {
  if (this.isCreatingOrder) {
    return;
  }

  this.isCheckoutScreen = false;
}

  /* ====================================================
     MAKE ORDER
  ==================================================== */

async makeOrder(): Promise<void> {
  if (this.isCreatingOrder) {
    return;
  }

  if (this.checkoutForm.invalid) {
    this.checkoutForm.markAllAsTouched();

    this.showToast(
      'Please correct the highlighted checkout fields.',
      'warning'
    );

    return;
  }

  const token = this.cartService.getCartToken();

  if (!token) {
    this.showToast(
      'Your cart session could not be found.',
      'danger'
    );

    return;
  }

  this.showOrderConfirmation = true;
}

  /* ====================================================
     PLACE ORDER
  ==================================================== */

  private placeOrder(
    token: string
  ): void {

    this.isCreatingOrder = true;

    this.errorMessage = '';


const formValue = this.checkoutForm.getRawValue();

const orderData: CreateOrderRequest = {
  cartToken: token,
  customerName: formValue.customerName.trim(),
  customerMobile: formValue.customerMobile.trim(),
  alternativeMobileNumber:
    formValue.alternativeMobileNumber.trim(),
  deliveryAddress: formValue.deliveryAddress.trim()
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


     this.cartService.saveCustomerMobile(
  this.checkoutForm.controls.customerMobile.value.trim()
);


          this.cartService.clearLocalCart();


          this.cartStores = [];

          this.cartItems = [];

          this.cartToken = '';


          this.calculateTotals();


this.checkoutForm.reset();


          this.cdr.detectChanges();


          this.showToast(
            `Order placed successfully.`,
            'success'
          );


          setTimeout(() => {

            this.router.navigate([
              '/orders'
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
     CREATE CONFIRM ALERT
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
      '/home'
    ]);

  }


  /* ====================================================
     BACK
  ==================================================== */

 goBack(): void {
  if (window.history.length > 1) {
    window.history.back();
  } else {
    this.router.navigate(['/home']);
  }
}

goHome(): void{
  this.router.navigate(['/home'])
}


openProduct(productId: number): void {

  if (!productId) {
    return;
  }

  this.router.navigate([
    '/product',
    productId
  ]);

}


cancelOrderConfirmation(): void {
  this.showOrderConfirmation = false;
  this.isCheckoutScreen = true;
}

confirmOrderAndPlace(): void {
  const token = this.cartService.getCartToken();

  if (!token) {
    this.showOrderConfirmation = false;

    this.showToast(
      'Your cart session could not be found.',
      'danger'
    );

    return;
  }

  this.showOrderConfirmation = false;
  this.placeOrder(token);
}

}