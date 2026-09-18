import {
  Component,
  OnInit,
  ChangeDetectorRef
} from '@angular/core';

import {
  ActivatedRoute,
  Router
} from '@angular/router';

import {
  IonContent,
  IonIcon,
  IonBackButton
} from '@ionic/angular';

import { addIcons } from 'ionicons';

import {
  cartOutline,
  chevronBackOutline,
  chevronForwardOutline,
  addOutline,
  removeOutline,
  checkmarkCircleOutline,
  imageOutline
} from 'ionicons/icons';

import {
  ProductService,
  Product
} from '../../services/product.service';


@Component({
  selector: 'app-product',

  standalone: true,

  templateUrl: './product.page.html',

  styleUrls: ['./product.page.scss'],

  imports: [
    IonContent,
    IonIcon,
    IonBackButton
  ]
})
export class ProductPage implements OnInit {


  /* =====================================
     IMAGE
     ===================================== */

  selectedImageIndex = 0;


  /* =====================================
     QUANTITY
     ===================================== */

  quantity = 1;


  /* =====================================
     CART
     ===================================== */

  addedToCart = false;


  /* =====================================
     PRODUCTS
     ===================================== */

  products: Product[] = [];


  /* =====================================
     CURRENT PRODUCT
     ===================================== */

  product: Product | null = null;


  /* =====================================
     EXPLORE MORE
     ===================================== */

  exploreProducts: Product[] = [];


  /* =====================================
     STATE
     ===================================== */

  isLoading = false;

  errorMessage = '';


  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private cdr: ChangeDetectorRef
  ) {

    addIcons({

      cartOutline,

      chevronBackOutline,

      chevronForwardOutline,

      addOutline,

      removeOutline,

      checkmarkCircleOutline,

      imageOutline

    });

  }


  /* =====================================
     INITIAL LOAD
     ===================================== */

  ngOnInit(): void {

    /*
     * Listen to route changes.
     *
     * This allows Product Details to
     * update correctly when the user
     * clicks another product from
     * Explore More.
     */

    this.route.paramMap
      .subscribe(params => {

        const productStoreId =
          Number(
            params.get('id')
          );


        console.log(
          'Selected productStoreId:',
          productStoreId
        );


        this.loadProduct(
          productStoreId
        );

      });

  }


  /* =====================================
     LOAD PRODUCT
     ===================================== */

  loadProduct(
    productStoreId: number
  ): void {

    this.isLoading = true;

    this.errorMessage = '';

    this.product = null;

    this.exploreProducts = [];

    this.selectedImageIndex = 0;

    this.quantity = 1;

    this.cdr.detectChanges();


    this.productService
      .getProducts()
      .subscribe({

        next: (response) => {

          console.log(
            'Products API Response:',
            response
          );


          /*
           * Store all products.
           */

          this.products =
            response?.content || [];


          /*
           * Find the exact store-specific
           * product.
           *
           * productStoreId is used because
           * productId can repeat.
           */

          const foundProduct =
            this.products.find(
              product =>
                product.productStoreId ===
                productStoreId
            );


          /*
           * Product not found.
           */

          if (!foundProduct) {

            this.product = null;

            this.exploreProducts = [];

            this.isLoading = false;

            this.errorMessage =
              'Product not found.';

            this.cdr.detectChanges();

            return;
          }


          /*
           * Set current product.
           */

          this.product =
            foundProduct;


          /*
           * Reset product state.
           */

          this.selectedImageIndex = 0;

          this.quantity = 1;


          /*
           * =================================
           * EXPLORE MORE
           * =================================
           *
           * Exclude every store entry having
           * the same productId.
           *
           * This means if Bhuchakram has:
           *
           * productId 1 / storeId 1
           * productId 1 / storeId 2
           * productId 1 / storeId 6
           *
           * all three are excluded when
           * viewing any one of them.
           */

          this.exploreProducts =
            this.products.filter(
              product =>
                product.productId !==
                this.product!.productId
            );


          console.log(
            'Current Product:',
            this.product
          );


          console.log(
            'Explore More:',
            this.exploreProducts
          );


          this.isLoading = false;

          this.cdr.detectChanges();

        },


        error: (error) => {

          console.error(
            'Product Details API Error:',
            error
          );


          this.products = [];

          this.product = null;

          this.exploreProducts = [];

          this.isLoading = false;

          this.errorMessage =
            error?.error?.message ||
            error?.message ||
            'Unable to load product.';


          this.cdr.detectChanges();

        }

      });

  }


  /* =====================================
     SELECT IMAGE
     ===================================== */

  selectImage(
    index: number
  ): void {

    if (!this.product) {
      return;
    }

    if (
      !this.product.imageUrls ||
      this.product.imageUrls.length === 0
    ) {
      return;
    }

    this.selectedImageIndex =
      index;

  }


  /* =====================================
     PREVIOUS IMAGE
     ===================================== */

  previousImage(): void {

    if (!this.product) {
      return;
    }


    if (
      !this.product.imageUrls ||
      this.product.imageUrls.length === 0
    ) {
      return;
    }


    if (
      this.selectedImageIndex === 0
    ) {

      this.selectedImageIndex =
        this.product.imageUrls.length - 1;

      return;
    }


    this.selectedImageIndex--;

  }


  /* =====================================
     NEXT IMAGE
     ===================================== */

  nextImage(): void {

    if (!this.product) {
      return;
    }


    if (
      !this.product.imageUrls ||
      this.product.imageUrls.length === 0
    ) {
      return;
    }


    if (
      this.selectedImageIndex ===
      this.product.imageUrls.length - 1
    ) {

      this.selectedImageIndex = 0;

      return;
    }


    this.selectedImageIndex++;

  }


  /* =====================================
     INCREASE QUANTITY
     ===================================== */

  increaseQuantity(): void {

    if (!this.product) {
      return;
    }


    if (
      this.quantity <
      this.product.stockQuantity
    ) {

      this.quantity++;

    }

  }


  /* =====================================
     DECREASE QUANTITY
     ===================================== */

  decreaseQuantity(): void {

    if (this.quantity > 1) {

      this.quantity--;

    }

  }


  /* =====================================
     ADD TO CART
     ===================================== */

  addToCart(): void {

    if (!this.product) {
      return;
    }


    console.log(
      'Adding product to cart:',
      {
        product: this.product,
        quantity: this.quantity
      }
    );


    this.addedToCart = true;

    this.cdr.detectChanges();


    setTimeout(() => {

      this.addedToCart = false;

      this.cdr.detectChanges();

    }, 2000);

  }


  /* =====================================
     OPEN EXPLORE PRODUCT
     ===================================== */

  openProduct(
    product: Product
  ): void {

    this.router.navigate([
      '/tabs/product',
      product.productStoreId
    ]);

  }


  /* =====================================
     TRACK PRODUCTS
     ===================================== */

  trackProduct(
    index: number,
    product: Product
  ): number {

    return product.productStoreId;

  }

}