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

import { CartService } from '../../services/cart.service';

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

  /*
   * Existing UI state.
   *
   * This remains available so your
   * current HTML does not break.
   */
  addedToCart = false;


  /*
   * Prevents multiple clicks while
   * the Add To Cart API is running.
   */
  isAddingToCart = false;


  /*
   * Once true, the same product cannot
   * be added to the cart again.
   */
  isAddedToCart = false;


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

    private cdr: ChangeDetectorRef,

    private cartService: CartService
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


    /* ===================================
       RESET PRODUCT STATE
    =================================== */

    this.isLoading = true;

    this.errorMessage = '';

    this.product = null;

    this.exploreProducts = [];

    this.selectedImageIndex = 0;

    this.quantity = 1;

    /*
     * Reset cart state while loading
     * another product.
     */
    this.addedToCart = false;

    this.isAddingToCart = false;

    this.isAddedToCart = false;


    this.cdr.detectChanges();


    /* ===================================
       GET PRODUCTS
    =================================== */

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


          /* ==============================
             PRODUCT NOT FOUND
          ============================== */

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


          /* ==============================
             SET CURRENT PRODUCT
          ============================== */

          this.product =
            foundProduct;


          /*
           * Reset product state.
           */

          this.selectedImageIndex = 0;

          this.quantity = 1;


          /* ==============================
             CHECK CART STATE
          ============================== */

          this.checkCartState(
            foundProduct.productStoreId
          );


          /* ==============================
             EXPLORE MORE
          ============================== */

          /*
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


          /* ==============================
             START IMAGE SLIDER
          ============================== */

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
     CHECK CART STATE
     ===================================== */

  private checkCartState(
    productStoreId: number
  ): void {

    /*
     * First check whether CartService
     * already has the current cart.
     */

    const currentCart =
      this.cartService.getCurrentCart();


    if (currentCart) {

      this.isAddedToCart =
        currentCart.items?.some(
          item =>
            item.productStoreId ===
            productStoreId
        ) ?? false;


      /*
       * Keep existing UI state in sync.
       */

      this.addedToCart =
        this.isAddedToCart;


      this.cdr.detectChanges();

      return;
    }


    /*
     * If there is no cart currently loaded,
     * check whether a cart token exists.
     */

    const cartToken =
      this.cartService.getCartToken();


    /*
     * No token means the user has never
     * created a cart.
     */

    if (!cartToken) {

      this.isAddedToCart = false;

      this.addedToCart = false;

      this.cdr.detectChanges();

      return;

    }


    /*
     * A token exists, so retrieve the
     * current cart to determine whether
     * this product was already added.
     */

    this.cartService
      .getCart()
      .subscribe({

        next: (cart) => {

          this.isAddedToCart =
            cart.items?.some(
              item =>
                item.productStoreId ===
                productStoreId
            ) ?? false;


          this.addedToCart =
            this.isAddedToCart;


          this.cdr.detectChanges();

        },


        error: (error) => {

          console.error(
            'Check Cart State Error:',
            error
          );


          /*
           * Do not block the product page
           * if cart retrieval fails.
           */

          this.isAddedToCart = false;

          this.addedToCart = false;

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


    /*
     * Do not allow quantity to go above
     * available product stock.
     */

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

    /*
     * Product must exist.
     */

    if (!this.product) {

      return;

    }


    /*
     * Prevent another request if:
     *
     * 1. The current request is still running.
     * 2. This product is already in cart.
     */

    if (
      this.isAddingToCart ||
      this.isAddedToCart
    ) {

      return;

    }


    /*
     * Product store ID is REQUIRED by
     * the Add To Cart API.
     */

    const productStoreId =
      this.product.productStoreId;


    /*
     * Quantity selected by the user.
     */

    const quantity =
      this.quantity;


    /*
     * Basic safety check.
     */

    if (
      quantity < 1 ||
      quantity >
      this.product.stockQuantity
    ) {

      this.errorMessage =
        'Please select a valid quantity.';

      this.cdr.detectChanges();

      return;

    }


    console.log(
      'Adding product to cart:',
      {
        productStoreId,
        quantity
      }
    );


    /*
     * Clear previous error.
     */

    this.errorMessage = '';


    /*
     * Show loading state.
     */

    this.isAddingToCart = true;

    this.cdr.detectChanges();


    /*
     * CartService automatically decides
     * whether the request should contain:
     *
     * First product:
     *
     * {
     *   productStoreId,
     *   quantity
     * }
     *
     * Later products:
     *
     * {
     *   cartToken,
     *   productStoreId,
     *   quantity
     * }
     */

    this.cartService
      .addToCart(
        productStoreId,
        quantity
      )
      .subscribe({

        next: (response) => {

          console.log(
            'Add To Cart Response:',
            response
          );


          /*
           * Request completed successfully.
           */

          this.isAddingToCart = false;


          /*
           * Permanently mark this product
           * as added while this product page
           * is open.
           *
           * CartService also has the latest
           * cart response now.
           */

          this.isAddedToCart = true;

          this.addedToCart = true;


          /*
           * Make sure the UI updates immediately.
           */

          this.cdr.detectChanges();

        },


        error: (error) => {

          console.error(
            'Add To Cart Error:',
            error
          );


          /*
           * Restore button after failure.
           */

          this.isAddingToCart = false;

          this.isAddedToCart = false;

          this.addedToCart = false;


          /*
           * Display backend error if available.
           */

          this.errorMessage =
            error?.error?.message ||
            error?.message ||
            'Unable to add product to cart. Please try again.';


          this.cdr.detectChanges();

        }

      });

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