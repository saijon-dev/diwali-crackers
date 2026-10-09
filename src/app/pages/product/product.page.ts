import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  QueryList,
  ViewChild,
  ViewChildren
} from '@angular/core';

import {
  ActivatedRoute,
  Router
} from '@angular/router';

import {
  HttpClient
} from '@angular/common/http';

import {
  IonContent,
  IonIcon
} from '@ionic/angular';

import { addIcons } from 'ionicons';

import {
  cartOutline,
  arrowBackOutline,
  chevronBackOutline,
  chevronForwardOutline,
  addOutline,
  removeOutline,
  checkmarkCircleOutline,
  checkmarkOutline,
  imageOutline,
  callOutline,
} from 'ionicons/icons';

import { CartService } from '../../services/cart.service';

import {
  ProductService,
  Product
} from '../../services/product.service';

import {
  FloatingCartComponent
} from '../../components/floating-cart/floating-cart.component';

import {
  environment
} from '../../../environments/environment';


/* =========================================================
   CATEGORY MODEL
========================================================= */

interface ProductCategory {
  categoryId: number;
  categoryName: string;
}


/* =========================================================
   COMPONENT
========================================================= */

@Component({
  selector: 'app-product',
  standalone: true,
  templateUrl: './product.page.html',
  imports: [
    IonContent,
    IonIcon,
    FloatingCartComponent
  ]
})
export class ProductPage implements OnInit, OnDestroy {

  @ViewChild(IonContent)
  content!: IonContent;

  @ViewChild('categoryScroller')
  categoryScroller?: ElementRef<HTMLDivElement>;

  @ViewChildren('categoryItem')
  categoryItems!: QueryList<ElementRef<HTMLButtonElement>>;


  /* =========================================================
     PRODUCT
  ========================================================= */

  product: Product | null = null;


  /* =========================================================
     ALL VENDOR PRODUCTS

     Loaded once when Product Details opens.
  ========================================================= */

  private allVendorProducts: Product[] = [];


  /* =========================================================
     CATEGORY SELECTION
  ========================================================= */

  categories: ProductCategory[] = [];

  selectedCategoryId: number | null = null;

  private categoryScrollFrame: number | null = null;


  /* =========================================================
     CATEGORY LOADING
  ========================================================= */

  isCategoriesLoading = false;


  /*
   * Only products belonging to the selected category
   * are displayed below the category selector.
   *
   * The currently displayed main product is excluded.
   */

  get categoryProducts(): Product[] {

    if (this.selectedCategoryId === null) {
      return [];
    }

    const selectedCategory = this.categories.find(
      category =>
        category.categoryId === this.selectedCategoryId
    );

    if (!selectedCategory) {
      return [];
    }

    return this.exploreProducts.filter(
      item =>
        (item.categoryName || '').trim().toLowerCase() ===
        selectedCategory.categoryName.trim().toLowerCase()
    );
  }


  /* =========================================================
     OTHER PRODUCTS
  ========================================================= */

  exploreProducts: Product[] = [];

  exploreAddingProductStoreId: number | null = null;


  /* =========================================================
     IMAGE
  ========================================================= */

  selectedImageIndex = 0;

  private imageInterval: ReturnType<typeof setInterval> | null = null;


  /* =========================================================
     QUANTITY
  ========================================================= */

  quantity = 1;


  /* =========================================================
     CART
  ========================================================= */

  isAddingToCart = false;

  isAddedToCart = false;


  /* =========================================================
     PAGE STATE
  ========================================================= */

  isLoading = false;

  errorMessage = '';


  /* =========================================================
     CONSTRUCTOR
  ========================================================= */

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly productService: ProductService,
    private readonly cdr: ChangeDetectorRef,
    private readonly cartService: CartService,
    private readonly http: HttpClient
  ) {
    addIcons({
      cartOutline,
      arrowBackOutline,
      chevronBackOutline,
      chevronForwardOutline,
      addOutline,
      removeOutline,
      checkmarkCircleOutline,
      checkmarkOutline,
      imageOutline,
      callOutline
    });
  }


  /* =========================================================
     INIT
  ========================================================= */

  ngOnInit(): void {

    this.route.paramMap.subscribe(params => {

      /*
       * The Product Details route receives productStoreId.
       *
       * Example:
       * /product/22
       *
       * 22 = productStoreId
       */

      const productStoreId =
        Number(params.get('id'));


      if (
        !productStoreId ||
        productStoreId <= 0
      ) {

        this.errorMessage =
          'Invalid product.';

        this.isLoading = false;

        this.cdr.detectChanges();

        return;
      }


      /* =========================================
         LOAD ONLY VENDOR-USED CATEGORIES
      ========================================= */

      this.loadCategories(
        productStoreId
      );


      /* =========================================
         LOAD VENDOR PRODUCTS
      ========================================= */

      this.loadVendorProducts(
        productStoreId
      );

    });

  }


  /* =========================================================
     LOAD CATEGORIES FOR PRODUCT STORE

     Only categories currently used by this vendor's
     products are returned.

     API:
     GET /api/categories/product-stores/{productStoreId}/categories
  ========================================================= */

  private loadCategories(productStoreId: number): void {

    this.isCategoriesLoading = true;

    this.productService
      .getCategoriesByProductStore(productStoreId)
      .subscribe({

        next: categories => {

          this.categories = categories
            .map(category => ({
              categoryId: Number(category.categoryId),
              categoryName: String(
                category.categoryName || ''
              ).trim()
            }))
            .filter(category =>
              Number.isFinite(category.categoryId) &&
              category.categoryId > 0 &&
              category.categoryName.length > 0
            );


          /* =========================================
             SELECT PRODUCT CATEGORY
          ========================================= */

          if (this.product) {

            this.selectCategoryForProduct(
              this.product
            );

          }
          else if (this.categories.length > 0) {

            this.selectedCategoryId =
              this.categories[0].categoryId;

          }


          this.isCategoriesLoading = false;

          this.cdr.detectChanges();


          /*
           * Center only after Angular has rendered
           * the category buttons.
           */

          if (this.selectedCategoryId !== null) {

            this.centerCategory(
              this.selectedCategoryId
            );

          }

        },


        error: error => {

          console.error(
            'Vendor Categories API Error:',
            error
          );

          this.categories = [];

          this.selectedCategoryId = null;

          this.isCategoriesLoading = false;

          this.cdr.detectChanges();

        }

      });

  }


  /* =========================================================
     LOAD ALL VENDOR PRODUCTS

     API:
     /{productStoreId}/all-vendor-products
  ========================================================= */

  private loadVendorProducts(
    selectedProductStoreId: number
  ): void {

    this.stopImageSlider();

    this.isLoading = true;

    this.errorMessage = '';

    this.product = null;

    this.exploreProducts = [];

    this.allVendorProducts = [];

    this.selectedImageIndex = 0;

    this.quantity = 1;

    this.isAddingToCart = false;

    this.isAddedToCart = false;

    this.exploreAddingProductStoreId = null;

    this.cdr.detectChanges();


    this.productService
      .getAllVendorProducts(selectedProductStoreId)
      .subscribe({

        next: response => {

          console.log(
            'All Vendor Products Response:',
            response
          );


          this.allVendorProducts =
            response?.content ?? [];


          /*
           * Find the exact selected product.
           */

          const selectedProduct =
            this.allVendorProducts.find(
              item =>
                Number(item.productStoreId) ===
                Number(selectedProductStoreId)
            );


          /*
           * Product not found.
           */

          if (!selectedProduct) {

            this.product = null;

            this.exploreProducts = [];

            this.isLoading = false;

            this.errorMessage =
              'Unable to find the selected product.';

            this.cdr.detectChanges();

            return;
          }


          /*
           * Display the selected product as the
           * main product.
           */

          this.setMainProduct(selectedProduct);


          /*
           * Other vendor products are cached locally.
           * No additional product API call is required
           * when selecting another product.
           */

          this.updateExploreProducts();


          this.isLoading = false;

          this.errorMessage = '';

          this.cdr.detectChanges();

          this.startImageSlider();

        },


        error: error => {

          console.error(
            'All Vendor Products Error:',
            error
          );

          this.product = null;

          this.allVendorProducts = [];

          this.exploreProducts = [];

          this.isLoading = false;

          this.errorMessage =
            error?.error?.message ||
            error?.message ||
            'Unable to load vendor products.';

          this.stopImageSlider();

          this.cdr.detectChanges();

        }

      });

  }


  /* =========================================================
     SET MAIN PRODUCT

     Used for:
     1. Initially selected product
     2. Product selected from category products

     No product API call here.
  ========================================================= */

  private setMainProduct(product: Product): void {

    this.product = product;

    this.selectedImageIndex = 0;

    this.quantity = 1;

    this.isAddingToCart = false;

    this.isAddedToCart = false;

    this.exploreAddingProductStoreId = null;

    this.stopImageSlider();

    this.checkCartState(product.productStoreId);

    /*
     * Select the category belonging to the main product.
     */

    this.selectCategoryForProduct(product);

    this.cdr.detectChanges();

    this.startImageSlider();

  }


  /* =========================================================
     SELECT THE CATEGORY FOR A PRODUCT
  ========================================================= */

  private selectCategoryForProduct(product: Product): void {

    if (this.categories.length === 0) {
      return;
    }

    const productCategoryName =
      (product.categoryName || '').trim().toLowerCase();

    const matchingCategory = this.categories.find(
      category =>
        category.categoryName.trim().toLowerCase() ===
        productCategoryName
    );

    if (matchingCategory) {

      this.selectedCategoryId =
        matchingCategory.categoryId;

      this.centerCategory(
        matchingCategory.categoryId
      );

      return;
    }


    /*
     * If the product category is not returned by the
     * categories API, keep the current selection when
     * possible. Otherwise select the first category.
     */

    if (
      this.selectedCategoryId === null &&
      this.categories.length > 0
    ) {

      this.selectedCategoryId =
        this.categories[0].categoryId;

      this.centerCategory(
        this.selectedCategoryId
      );

    }

  }


  /* =========================================================
     UPDATE OTHER PRODUCTS

     Uses the already-loaded products.
     No API call.
  ========================================================= */

  private updateExploreProducts(): void {

    if (!this.product) {

      this.exploreProducts = [];

      return;
    }

    this.exploreProducts =
      this.allVendorProducts.filter(
        item =>
          Number(item.productStoreId) !==
          Number(this.product!.productStoreId)
      );

    this.cdr.detectChanges();

  }


  /* =========================================================
     CATEGORY SELECTION
  ========================================================= */

  selectCategory(category: ProductCategory): void {

    if (
      this.selectedCategoryId === category.categoryId
    ) {

      this.centerCategory(
        category.categoryId
      );

      return;
    }


    this.selectedCategoryId =
      category.categoryId;

    this.centerCategory(
      category.categoryId
    );

    this.cdr.detectChanges();

  }


  /* =========================================================
     CENTER THE SELECTED CATEGORY
  ========================================================= */

  private centerCategory(categoryId: number): void {

    requestAnimationFrame(() => {

      const scroller =
        this.categoryScroller?.nativeElement;

      if (!scroller) {
        return;
      }

      const selectedElement =
        scroller.querySelector<HTMLButtonElement>(
          `[data-category-id="${categoryId}"]`
        );

      if (!selectedElement) {
        return;
      }

      const scrollLeft =
        selectedElement.offsetLeft -
        (scroller.clientWidth -
          selectedElement.offsetWidth) / 2;

      scroller.scrollTo({

        left: Math.max(
          0,
          Math.min(
            scrollLeft,
            scroller.scrollWidth -
              scroller.clientWidth
          )
        ),

        behavior: 'smooth'

      });

    });

  }


  /* =========================================================
     CATEGORY SCROLL
  ========================================================= */

  onCategoryScroll(): void {

    if (this.categoryScrollFrame !== null) {
      return;
    }

    this.categoryScrollFrame =
      requestAnimationFrame(() => {

        this.categoryScrollFrame = null;

        const scroller =
          this.categoryScroller?.nativeElement;

        if (!scroller) {
          return;
        }

        const elements =
          Array.from(
            scroller.querySelectorAll<HTMLButtonElement>(
              '[data-category-id]'
            )
          );

        if (elements.length === 0) {
          return;
        }

        const scrollerRect =
          scroller.getBoundingClientRect();

        const centerX =
          scrollerRect.left +
          scrollerRect.width / 2;

        let closestId: number | null = null;

        let closestDistance =
          Number.POSITIVE_INFINITY;


        for (const element of elements) {

          const rect =
            element.getBoundingClientRect();

          const elementCenter =
            rect.left +
            rect.width / 2;

          const distance =
            Math.abs(
              centerX -
              elementCenter
            );

          if (distance < closestDistance) {

            closestDistance =
              distance;

            closestId =
              Number(
                element.dataset['categoryId']
              );

          }

        }


        if (
          closestId !== null &&
          closestId !== this.selectedCategoryId
        ) {

          this.selectedCategoryId =
            closestId;

          this.cdr.detectChanges();

        }

      });

  }


  /* =========================================================
     CART STATE
  ========================================================= */

  private checkCartState(productStoreId: number): void {

    this.cartService
      .getCart()
      .subscribe({

        next: cart => {

          this.isAddedToCart =
            cart.stores?.some(
              store =>
                store.items?.some(
                  item =>
                    Number(item.productStoreId) ===
                    Number(productStoreId)
                ) ?? false
            ) ?? false;

          this.cdr.detectChanges();

        },


        error: error => {

          console.error(
            'Check Cart State Error:',
            error
          );

          this.isAddedToCart = false;

          this.cdr.detectChanges();

        }

      });

  }


  /* =========================================================
     IMAGE SLIDER
  ========================================================= */

  startImageSlider(): void {

    this.stopImageSlider();

    if (
      !this.product?.images ||
      this.product.images.length <= 1
    ) {
      return;
    }

    this.imageInterval = setInterval(() => {

      if (
        !this.product?.images ||
        this.product.images.length <= 1
      ) {
        return;
      }

      this.selectedImageIndex =
        (this.selectedImageIndex + 1) %
        this.product.images.length;

      this.cdr.detectChanges();

    }, 4000);

  }


  stopImageSlider(): void {

    if (this.imageInterval !== null) {

      clearInterval(
        this.imageInterval
      );

      this.imageInterval = null;

    }

  }


  getCurrentImage(): string {

    if (
      !this.product?.images ||
      this.product.images.length === 0
    ) {

      return 'assets/images/rectangle-image.png';

    }

    return (
      this.product.images[
        this.selectedImageIndex
      ]?.imageUrl ||
      'assets/images/rectangle-image.png'
    );

  }


  selectImage(index: number): void {

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

    this.selectedImageIndex = index;

    this.startImageSlider();

    this.cdr.detectChanges();

  }


  previousImage(): void {

    if (!this.product) {
      return;
    }

    if (
      !this.product.images ||
      this.product.images.length <= 1
    ) {
      return;
    }

    if (this.selectedImageIndex === 0) {

      this.selectedImageIndex =
        this.product.images.length - 1;

    } else {

      this.selectedImageIndex--;

    }

    this.startImageSlider();

    this.cdr.detectChanges();

  }


  nextImage(): void {

    if (!this.product) {
      return;
    }

    if (
      !this.product.images ||
      this.product.images.length <= 1
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

    this.startImageSlider();

    this.cdr.detectChanges();

  }


  /* =========================================================
     QUANTITY
  ========================================================= */

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


  decreaseQuantity(): void {

    if (this.quantity > 1) {
      this.quantity--;
    }

  }


  /* =========================================================
     MAIN PRODUCT - ADD TO CART
  ========================================================= */

  addToCart(): void {

    if (!this.product) {
      return;
    }

    if (
      this.isAddingToCart ||
      this.isAddedToCart
    ) {
      return;
    }

    const productStoreId =
      this.product.productStoreId;

    const quantity =
      this.quantity;


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


    this.errorMessage = '';

    this.isAddingToCart = true;

    this.cdr.detectChanges();


    this.cartService
      .addToCart(
        productStoreId,
        quantity
      )
      .subscribe({

        next: response => {

          console.log(
            'Add To Cart Response:',
            response
          );

          this.isAddingToCart = false;

          this.isAddedToCart = true;

          if (this.product) {

            this.product.alreadyAdded = true;

          }

          this.cdr.detectChanges();

        },


        error: error => {

          console.error(
            'Add To Cart Error:',
            error
          );

          this.isAddingToCart = false;

          this.isAddedToCart = false;

          this.errorMessage =
            error?.error?.message ||
            error?.message ||
            'Unable to add product to cart. Please try again.';

          this.cdr.detectChanges();

        }

      });

  }


  /* =========================================================
     OPEN A PRODUCT FROM THE SELECTED CATEGORY

     Uses cached products.
     No additional product API call.
  ========================================================= */

  openProduct(product: Product): void {

    if (!product?.productStoreId) {
      return;
    }

    this.setMainProduct(product);

    this.updateExploreProducts();

    setTimeout(() => {
      this.scrollToTop();
    }, 0);

  }


  /* =========================================================
     SCROLL TO TOP
  ========================================================= */

  private async scrollToTop(): Promise<void> {

    if (!this.content) {
      return;
    }

    await this.content.scrollToTop(300);

  }


  /* =========================================================
     BACK
  ========================================================= */

  goBack(): void {

    if (window.history.length > 1) {

      window.history.back();

    } else {

      this.router.navigate(['/home']);

    }

  }


  /* =========================================================
     DESTROY
  ========================================================= */

  ngOnDestroy(): void {

    this.stopImageSlider();

    if (
      this.categoryScrollFrame !== null
    ) {

      cancelAnimationFrame(
        this.categoryScrollFrame
      );

      this.categoryScrollFrame = null;

    }

  }


  callStore(): void {
  const contactNumber = this.product?.contactNumber?.trim();

  if (!contactNumber) {
    return;
  }

  window.location.href = `tel:${contactNumber}`;
}

}