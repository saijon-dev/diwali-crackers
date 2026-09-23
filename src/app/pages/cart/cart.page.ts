import {
  Component,
  OnInit,
  ChangeDetectorRef
} from '@angular/core';

import {
  IonContent,
  IonIcon
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
  chevronForwardOutline
} from 'ionicons/icons';


/* ======================================================
   CART ITEM MODEL

   Temporary frontend model.

   Later this can be replaced/updated according
   to the actual Cart GET API response.
====================================================== */

export interface CartItem {

  cartItemId: number;

  productId: number;

  productName: string;

  categoryName: string;

  imageUrl: string;

  packQuantity: number;

  packUnit: string;

  sellingPrice: number;

  quantity: number;

  availableStock: number;

}


/* ======================================================
   COMPONENT
====================================================== */

@Component({
  selector: 'app-cart',
  templateUrl: './cart.page.html',
  styleUrls: ['./cart.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonIcon
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
     TEMPORARY CART DATA

     Later this will come from:

     GET /api/cart
     or whatever endpoint backend provides.
  ==================================================== */

  cartItems: CartItem[] = [

    {
      cartItemId: 1,
      productId: 7,
      productName: 'Color Sparklers',
      categoryName: 'Sparklers',
      imageUrl: 'assets/images/rectangle-image.png',
      packQuantity: 10,
      packUnit: 'BOX',
      sellingPrice: 120,
      quantity: 2,
      availableStock: 20
    },

    {
      cartItemId: 2,
      productId: 8,
      productName: 'Flower Pot',
      categoryName: 'Flower Pots',
      imageUrl: 'assets/images/rectangle-image.png',
      packQuantity: 5,
      packUnit: 'BOX',
      sellingPrice: 250,
      quantity: 1,
      availableStock: 15
    },

    {
      cartItemId: 3,
      productId: 9,
      productName: 'Color Rocket',
      categoryName: 'Rockets',
      imageUrl: 'assets/images/rectangle-image.png',
      packQuantity: 5,
      packUnit: 'PACK',
      sellingPrice: 180,
      quantity: 2,
      availableStock: 10
    },

    {
      cartItemId: 4,
      productId: 10,
      productName: 'Chakkar',
      categoryName: 'Chakkars',
      imageUrl: 'assets/images/rectangle-image.png',
      packQuantity: 10,
      packUnit: 'BOX',
      sellingPrice: 150,
      quantity: 1,
      availableStock: 12
    }

  ];


  /* ====================================================
     BILLING
  ==================================================== */

  discount = 0;

  deliveryCharge = 0;


  constructor(
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {

    addIcons({

      arrowBackOutline,

      removeOutline,

      addOutline,

      trashOutline,

      cartOutline,

      imageOutline,

      chevronForwardOutline

    });

  }


  /* ====================================================
     INIT
  ==================================================== */

  ngOnInit(): void {

    /*
     * TEMPORARY
     *
     * Later:
     *
     * this.loadCart();
     */

    this.calculateTotals();

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

  getItemTotal(item: CartItem): number {

    return (
      item.sellingPrice *
      item.quantity
    );

  }


  /* ====================================================
     SUBTOTAL
  ==================================================== */

  subtotal = 0;

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


    item.quantity++;

    this.calculateTotals();

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


    item.quantity--;

    this.calculateTotals();

  }


  /* ====================================================
     REMOVE ITEM
  ==================================================== */

  removeItem(
    item: CartItem
  ): void {

    this.cartItems =
      this.cartItems.filter(
        cartItem =>
          cartItem.cartItemId !==
          item.cartItemId
      );


    this.calculateTotals();

  }


  /* ====================================================
     CONTINUE
  ==================================================== */

  continueToCheckout(): void {

    if (
      this.cartItems.length === 0
    ) {

      return;

    }


    /*
     * Later this can navigate to:

     /tabs/checkout

     or whatever checkout route
     we create.
     */

    this.router.navigate([
      '/tabs/checkout'
    ]);

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


  /* ====================================================
     FUTURE CART API

     We will implement this after the
     backend API is provided.
  ==================================================== */

  /*
  loadCart(): void {

    this.isLoading = true;

    this.cartService
      .getCart()
      .subscribe({

        next: (response) => {

          this.cartItems =
            response.items;

          this.isLoading = false;

          this.calculateTotals();

        },

        error: (error) => {

          this.errorMessage =
            'Unable to load cart.';

          this.isLoading = false;

        }

      });

  }
  */

}