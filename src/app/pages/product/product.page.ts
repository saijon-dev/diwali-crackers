import {
  Component,
  OnInit,
  OnDestroy,
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
export class ProductPage implements OnInit, OnDestroy {


  /* =====================================
     IMAGE
     ===================================== */

  selectedImageIndex = 0;

  /*
   * Automatically changes the product
   * image every 5 seconds.
   */
  private imageInterval:
    ReturnType<typeof setInterval> | null = null;


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

    /*
     * Stop the previous image slider
     * before loading another product.
     */

    this.stopImageSlider();


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

            this.stopImageSlider();

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


          /*
           * =================================
           * START AUTOMATIC IMAGE SLIDER
           * =================================
           */

          this.startImageSlider();

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


          /*
           * Make sure no previous product
           * slider is still running.
           */

          this.stopImageSlider();


          this.cdr.detectChanges();

        }

      });

  }


  /* =====================================
     START IMAGE SLIDER
     ===================================== */

  startImageSlider(): void {

    /*
     * Always clear an existing interval
     * before creating a new one.
     */

    this.stopImageSlider();


    /*
     * No slider needed if there is only
     * one image or no images.
     */

    if (
      !this.product?.images ||
      this.product.images.length <= 1
    ) {

      return;

    }


    this.imageInterval =
      setInterval(() => {

        if (
          !this.product?.images ||
          this.product.images.length <= 1
        ) {

          return;

        }


        /*
         * Move to the next image.
         *
         * When the last image is reached,
         * return to the first image.
         */

        this.selectedImageIndex =
          (
            this.selectedImageIndex + 1
          ) %
          this.product.images.length;


        /*
         * Force the view to update.
         */

        this.cdr.detectChanges();

      }, 5000);

  }


  /* =====================================
     STOP IMAGE SLIDER
     ===================================== */

  stopImageSlider(): void {

    if (
      this.imageInterval !== null
    ) {

      clearInterval(
        this.imageInterval
      );

      this.imageInterval = null;

    }

  }


  /* =====================================
     GET CURRENT IMAGE
     ===================================== */

  getCurrentImage(): string {

    if (
      !this.product?.images ||
      this.product.images.length === 0
    ) {

      return 'assets/images/rectangle-image.png';

    }


    return (
      this.product
        .images[
          this.selectedImageIndex
        ]
        ?.imageUrl
      ||
      'assets/images/rectangle-image.png'
    );

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
      !this.product.images ||
      this.product.images.length === 0
    ) {

      return;

    }


    if (
      index < 0 ||
      index >= this.product.images.length
    ) {

      return;

    }


    this.selectedImageIndex =
      index;


    /*
     * Restart automatic slider.
     *
     * Selected image stays visible for
     * another 5 seconds.
     */

    this.startImageSlider();


    this.cdr.detectChanges();

  }


  /* =====================================
     PREVIOUS IMAGE
     ===================================== */

  previousImage(): void {

    if (!this.product) {

      return;

    }


    if (
      !this.product.images ||
      this.product.images.length === 0
    ) {

      return;

    }


    if (
      this.selectedImageIndex === 0
    ) {

      this.selectedImageIndex =
        this.product.images.length - 1;

    } else {

      this.selectedImageIndex--;

    }


    /*
     * Restart automatic slider.
     */

    this.startImageSlider();


    this.cdr.detectChanges();

  }


  /* =====================================
     NEXT IMAGE
     ===================================== */

  nextImage(): void {

    if (!this.product) {

      return;

    }


    if (
      !this.product.images ||
      this.product.images.length === 0
    ) {

      return;

    }


    if (
      this.selectedImageIndex ===
      this.product.images.length - 1
    ) {

      this.selectedImageIndex = 0;

    } else {

      this.selectedImageIndex++;

    }


    /*
     * Restart automatic slider.
     */

    this.startImageSlider();


    this.cdr.detectChanges();

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

    if (
      this.quantity > 1
    ) {

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


  /* =====================================
     DESTROY
     ===================================== */

  ngOnDestroy(): void {

    /*
     * Stop the image slider when leaving
     * the Product Details page.
     *
     * This prevents the interval from
     * continuing in the background.
     */

    this.stopImageSlider();

  }

}