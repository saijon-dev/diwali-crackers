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
  FloatingCartComponent
} from '../../components/floating-cart/floating-cart.component';

import {
  IonContent,
  IonIcon,
  IonSelect,
  IonSelectOption
} from '@ionic/angular';

import { addIcons } from 'ionicons';

import {
  chevronDownOutline,
  imageOutline,
  cartOutline,
  arrowBackOutline,
  homeOutline,
  addOutline,
  checkmarkOutline
} from 'ionicons/icons';

import {
  ProductService,
  Product,
  Category,
  ProductPageResponse
} from '../../services/product.service';

import {
  CartService
} from '../../services/cart.service';


/* =====================================
   STORE SECTION
===================================== */

interface StoreSection {
  storeName: string;
  products: Product[];
}


/* =====================================
   CATEGORY SECTION
===================================== */

interface CategorySection {
  categoryId: number;
  categoryName: string;
  products: Product[];
}


/* =====================================
   COMPONENT
===================================== */

@Component({
  selector: 'app-categories',
  templateUrl: './categories.page.html',
  standalone: true,
  imports: [
    IonContent,
    IonIcon,
    IonSelect,
    IonSelectOption,
    FloatingCartComponent
  ]
})
export class CategoriesPage implements OnInit {


  /* =====================================
     CATEGORIES
  ===================================== */

  categories: Category[] = [];


  /* =====================================
     VENDOR-SPECIFIC CATEGORIES
  ===================================== */

  vendorCategories: Category[] = [];


  /* =====================================
     PRODUCTS

     Always Product[].
  ===================================== */

  products: Product[] = [];


  /* =====================================
     ALL PRODUCTS

     Complete response from the normal
     products API.

     Used to restore all products.
  ===================================== */

  allProducts: Product[] = [];


  /* =====================================
     CATEGORY SECTIONS
  ===================================== */

  categorySections: CategorySection[] = [];


  /* =====================================
     STORE SECTIONS
  ===================================== */

  storeSections: StoreSection[] = [];


  /* =====================================
     SELECTED CATEGORY
  ===================================== */

  selectedCategoryId: number | null = null;


  /* =====================================
     SELECTED STORE
  ===================================== */

  selectedStoreName: string | null = null;


  /* =====================================
     STORE VIEW
  ===================================== */

  isStoreView = false;


  /* =====================================
     STORE PRODUCTS
  ===================================== */

  selectedStoreProducts: Product[] = [];


  /* =====================================
     COMPLETE VENDOR PRODUCTS

     Complete response from:

     /api/{productStoreId}/all-vendor-products
  ===================================== */

  private allSelectedStoreProducts: Product[] = [];


  /* =====================================
     LOADING
  ===================================== */

  isLoading = false;


  /* =====================================
     ERROR
  ===================================== */

  errorMessage = '';


  /* =====================================
     CONSTRUCTOR
  ===================================== */

  constructor(
    private readonly productService: ProductService,
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef,
    private readonly cartService: CartService,
    private readonly activatedRoute: ActivatedRoute
  ) {

    addIcons({
      chevronDownOutline,
      imageOutline,
      cartOutline,
      arrowBackOutline,
      homeOutline,
      addOutline,
      checkmarkOutline
    });

  }


  /* =====================================
     INIT
  ===================================== */

  ngOnInit(): void {

    this.activatedRoute.queryParamMap.subscribe(
      params => {

        const categoryIdParam =
          params.get('categoryId');

        const storeIdParam =
          params.get('storeId');


        /* =================================
           STORE ID FROM HOME VENDOR CARD
        ================================= */

        if (storeIdParam !== null) {

          const storeId =
            Number(storeIdParam);


          if (
            Number.isInteger(storeId) &&
            storeId > 0
          ) {

            /*
             * Vendor card from Home gives
             * us storeId directly.
             *
             * Do not convert storeId into
             * productStoreId.
             */

            this.loadStoreProducts(
              storeId
            );

            return;

          }

        }


        /* =================================
           CATEGORY ID FROM HOME
        ================================= */

        if (categoryIdParam !== null) {

          const categoryId =
            Number(categoryIdParam);


          if (
            Number.isInteger(categoryId) &&
            categoryId > 0
          ) {

            /*
             * Prevent unnecessary API calls
             * when the selected category is
             * already displayed.
             */

            if (
              this.selectedCategoryId === categoryId &&
              this.products.length > 0 &&
              !this.isStoreView
            ) {

              return;

            }


            /*
             * Make sure normal category
             * mode is active.
             */

            this.isStoreView = false;


            this.selectedCategoryId =
              categoryId;


            this.loadCategoriesAndProducts(
              categoryId
            );

            return;

          }

        }


        /* =================================
           EXISTING STORE VIEW CHECK
        ================================= */

        if (this.isStoreView) {
          return;
        }


        /* =================================
           NORMAL CATEGORIES PAGE
        ================================= */

        if (this.products.length === 0) {

          this.loadCategoriesAndProducts();

          return;

        }


        /* =================================
           ALL CATEGORIES
        ================================= */

        this.selectedCategoryId =
          null;

        this.products =
          [...this.allProducts];

        this.buildStoreSections();

        this.cdr.detectChanges();

      }
    );

  }


  /* =====================================
     LOAD CATEGORIES AND PRODUCTS

     Initial page loading.

     If categoryId exists:
       → load category products

     Otherwise:
       → load all products
  ===================================== */

  private loadCategoriesAndProducts(
    categoryId?: number
  ): void {

    this.isLoading = true;

    this.errorMessage = '';

    this.productService
      .getCategories()
      .subscribe({

        next: (response: any) => {

          console.log(
            'Categories API Response:',
            response
          );


          /*
           * Support either:
           *
           * Category[]
           *
           * or:
           *
           * { content: Category[] }
           */

          this.categories =
            Array.isArray(response)
              ? response
              : (response?.content ?? []);


          /*
           * If a category was supplied,
           * load only that category.
           */

          if (
            categoryId !== undefined &&
            categoryId !== null
          ) {

            this.selectedCategoryId =
              categoryId;

            this.loadProductsByCategory(
              categoryId
            );

            return;

          }


          /*
           * Otherwise load complete
           * product list.
           */

          this.loadProducts();

        },


        error: (error) => {

          console.error(
            'Categories API Error:',
            error
          );


          this.categories = [];

          this.products = [];

          this.allProducts = [];

          this.categorySections = [];

          this.storeSections = [];

          this.isLoading = false;

          this.errorMessage =
            error?.error?.message ||
            error?.message ||
            'Unable to load categories.';

          this.cdr.detectChanges();

        }

      });

  }


  /* =====================================
     LOAD STORE PRODUCTS

     API:

     /api/stores/product-stores/{storeId}/store-products

     Example:

     /api/stores/product-stores/22/store-products
  ===================================== */

  private loadStoreProducts(
    storeId: number
  ): void {

    /*
     * Enter vendor/store view.
     */

    this.isStoreView = true;

    this.isLoading = true;

    this.errorMessage = '';


    /*
     * Reset previous vendor data.
     */

    this.selectedStoreName = null;

    this.selectedCategoryId = null;

    this.selectedStoreProducts = [];

    this.allSelectedStoreProducts = [];

    this.vendorCategories = [];


    /*
     * The vendor categories require
     * the global categories list.
     *
     * If categories are already loaded,
     * reuse them.
     *
     * Otherwise load them first.
     */

    if (this.categories.length > 0) {

      this.fetchStoreProducts(
        storeId
      );

      return;

    }


    this.productService
      .getCategories()
      .subscribe({

        next: (response: any) => {

          console.log(
            'Categories API Response for Store:',
            response
          );


          this.categories =
            Array.isArray(response)
              ? response
              : (response?.content ?? []);


          this.fetchStoreProducts(
            storeId
          );

        },

        error: (error) => {

          console.error(
            'Categories API Error for Store:',
            error
          );


          /*
           * Even if categories fail,
           * we still try to load the
           * vendor products.
           */

          this.categories = [];

          this.fetchStoreProducts(
            storeId
          );

        }

      });

  }


  /* =====================================
     FETCH STORE PRODUCTS

     Called after categories are available.
  ===================================== */

  private fetchStoreProducts(
    storeId: number
  ): void {

    this.productService
      .getStoreProducts(
        storeId,
        0,
        10
      )
      .subscribe({

        next: (response: ProductPageResponse) => {

          console.log(
            'Store Products API Response:',
            response
          );


          /*
           * Store-products API returns:

           * {
           *   content: Product[],
           *   ...
           * }
           *
           * We need only content.
           */

          const storeProducts =
            response?.content ?? [];


          /*
           * Store products are now the
           * vendor products displayed
           * by the existing Categories UI.
           */

          this.allSelectedStoreProducts =
            [...storeProducts];


          this.selectedStoreProducts =
            [...storeProducts];


          /*
           * Also keep products populated.
           *
           * This allows existing product
           * grouping / shared UI logic to
           * continue working.
           */

          this.products =
            [...storeProducts];


          /*
           * The store name is available
           * from the product response.
           */

          this.selectedStoreName =
            storeProducts.length > 0
              ? (
                  storeProducts[0]
                    .storeName?.trim() ||
                  'Store'
                )
              : null;


          /*
           * Build categories available
           * for this vendor.
           */

          this.buildVendorCategories();


          this.isLoading = false;

          this.errorMessage = '';

          this.cdr.detectChanges();

          this.scrollToTop();

        },


        error: (error) => {

          console.error(
            'Store Products API Error:',
            error
          );


          this.products = [];

          this.allSelectedStoreProducts = [];

          this.selectedStoreProducts = [];

          this.vendorCategories = [];

          this.selectedStoreName = null;

          this.isLoading = false;

          this.errorMessage =
            error?.error?.message ||
            error?.message ||
            'Unable to load vendor products.';

          this.cdr.detectChanges();

        }

      });

  }


  /* =====================================
     LOAD PRODUCTS

     Initial/all-categories API.

     Response:

     {
       content: Product[],
       ...
     }
  ===================================== */

  loadProducts(): void {

    this.isLoading = true;

    this.productService
      .getProducts()
      .subscribe({

        next: (response: ProductPageResponse) => {

          console.log(
            'Products API Response:',
            response
          );


          /*
           * IMPORTANT:
           *
           * response is ProductPageResponse.
           *
           * products must contain only
           * response.content.
           */

          this.allProducts =
            response?.content ?? [];


          this.products =
            [...this.allProducts];


          /*
           * Build normal store sections.
           */

          this.buildStoreSections();


          this.isLoading = false;

          this.errorMessage = '';

          this.cdr.detectChanges();

        },


        error: (error) => {

          console.error(
            'Products API Error:',
            error
          );


          this.products = [];

          this.allProducts = [];

          this.categorySections = [];

          this.storeSections = [];

          this.selectedStoreProducts = [];

          this.isLoading = false;

          this.errorMessage =
            error?.error?.message ||
            error?.message ||
            'Unable to load products.';

          this.cdr.detectChanges();

        }

      });

  }


  /* =====================================
     LOAD PRODUCTS BY CATEGORY

     API:

     /api/products/category/{categoryId}

     IMPORTANT:

     This API returns ProductPageResponse,
     NOT Product[].

     Therefore:

     response.content
     ↓
     this.products
  ===================================== */

  private loadProductsByCategory(
    categoryId: number
  ): void {

    this.isLoading = true;

    this.errorMessage = '';

    this.productService
      .getProductsByCategory(categoryId)
      .subscribe({

        next: (response: ProductPageResponse) => {

          console.log(
            'Category Products API Response:',
            response
          );


          /*
           * IMPORTANT FIX:
           *
           * Do NOT do:
           *
           * this.products = response;
           *
           * response is ProductPageResponse.
           *
           * We need response.content.
           */

          this.products =
            response?.content ?? [];


          console.log(
            'Category Products:',
            this.products
          );


          /*
           * Build store sections from
           * the category products.
           */

          this.buildStoreSections();


          this.isLoading = false;

          this.errorMessage = '';

          this.cdr.detectChanges();

        },


        error: (error) => {

          console.error(
            'Category Products API Error:',
            error
          );


          this.products = [];

          this.categorySections = [];

          this.storeSections = [];

          this.isLoading = false;

          this.errorMessage =
            error?.error?.message ||
            error?.message ||
            'Unable to load products for this category.';

          this.cdr.detectChanges();

        }

      });

  }


  /* =====================================
     BUILD STORE SECTIONS

     Groups products by storeName.
  ===================================== */

  buildStoreSections(): void {

    /*
     * Safety check.
     */

    if (!Array.isArray(this.products)) {

      console.error(
        'Products is not an array:',
        this.products
      );

      this.products = [];

    }


    const filteredProducts =
      [...this.products];


    /*
     * GROUP BY STORE
     */

    const storeMap =
      new Map<
        string,
        StoreSection
      >();


    filteredProducts.forEach(
      product => {

        const storeName =
          product.storeName?.trim() ||
          'Store';


        const storeKey =
          storeName.toLowerCase();


        if (!storeMap.has(storeKey)) {

          storeMap.set(
            storeKey,
            {
              storeName,
              products: []
            }
          );

        }


        storeMap
          .get(storeKey)!
          .products
          .push(product);

      }
    );


    this.storeSections =
      Array.from(
        storeMap.values()
      );

  }


  /* =====================================
     CATEGORY CHANGE

     NORMAL VIEW:
       API request

     VENDOR VIEW:
       local filtering
  ===================================== */

  selectCategory(
    categoryId: number | null
  ): void {

    /* ==================================
       ALL CATEGORIES
    ================================== */

    if (categoryId === null) {

      this.isStoreView = false;

      this.selectedStoreName = null;

      this.selectedStoreProducts = [];

      this.allSelectedStoreProducts = [];

      this.vendorCategories = [];

      this.selectedCategoryId = null;


      /*
       * Restore original complete
       * product list.
       */

      this.products =
        [...this.allProducts];


      /*
       * Remove query parameters.
       */

      this.router.navigate(
        ['/categories'],
        {
          queryParams: {}
        }
      );


      this.buildStoreSections();

      this.cdr.detectChanges();

      return;

    }


    /* ==================================
       NORMAL CATEGORY VIEW
    ================================== */

    this.isStoreView = false;

    this.selectedStoreName = null;

    this.selectedStoreProducts = [];

    this.allSelectedStoreProducts = [];

    this.vendorCategories = [];

    this.selectedCategoryId =
      categoryId;


    /*
     * Keep category ID in URL.
     */

    this.router.navigate(
      ['/categories'],
      {
        queryParams: {
          categoryId
        }
      }
    );


    /*
     * Load category products.
     */

    this.loadProductsByCategory(
      categoryId
    );

  }


  /* =====================================
     CATEGORY DROPDOWN
  ===================================== */

  onCategoryChange(
    event: CustomEvent
  ): void {

    const value =
      event.detail?.value;


    /* ==================================
       VENDOR PRODUCTS VIEW
    ================================== */

    if (this.isStoreView) {

      /*
       * ALL CATEGORIES
       */

      if (
        value === null ||
        value === undefined ||
        value === 'all' ||
        value === ''
      ) {

        this.selectedCategoryId = null;

        this.loadAllSelectedStoreProducts();

        return;

      }


      const categoryId =
        Number(value);


      if (
        !Number.isInteger(categoryId) ||
        categoryId <= 0
      ) {

        return;

      }


      this.selectedCategoryId =
        categoryId;


      this.filterSelectedStoreProducts(
        categoryId
      );

      return;

    }


    /* ==================================
       NORMAL CATEGORIES VIEW
    ================================== */

    if (
      value === null ||
      value === undefined ||
      value === 'all' ||
      value === ''
    ) {

      this.selectCategory(null);

      return;

    }


    const categoryId =
      Number(value);


    if (
      Number.isInteger(categoryId) &&
      categoryId > 0
    ) {

      this.selectCategory(
        categoryId
      );

    }

  }


  /* =====================================
     FILTER VENDOR PRODUCTS
  ===================================== */

  private filterSelectedStoreProducts(
    categoryId: number | null
  ): void {

    if (categoryId === null) {

      this.selectedStoreProducts =
        [...this.allSelectedStoreProducts];

    } else {

      this.selectedStoreProducts =
        this.allSelectedStoreProducts.filter(
          product =>
            product.categoryId ===
            categoryId
        );

    }


    this.cdr.detectChanges();

  }


  /* =====================================
     LOAD ALL SELECTED STORE PRODUCTS
  ===================================== */

  private loadAllSelectedStoreProducts(): void {

    this.selectedStoreProducts =
      [...this.allSelectedStoreProducts];

    this.cdr.detectChanges();

  }


  /* =====================================
     VIEW ALL STORE PRODUCTS

     API:

     /api/{productStoreId}/all-vendor-products

     Any productStoreId belonging to the
     selected store can be used.
  ===================================== */

  viewAllStore(
    store: StoreSection
  ): void {

    if (
      !store ||
      !store.products ||
      store.products.length === 0
    ) {

      return;

    }


    /*
     * Any productStoreId belonging
     * to this store.
     */

    const productStoreId =
      store.products[0]?.productStoreId;


    if (!productStoreId) {

      console.error(
        'No productStoreId found for vendor:',
        store.storeName
      );

      return;

    }


    /*
     * Save selected store.
     */

    this.selectedStoreName =
      store.storeName;


    /*
     * Enter vendor view.
     */

    this.isStoreView = true;


    /*
     * Reset category.
     */

    this.selectedCategoryId = null;


    /*
     * Clear previous vendor data.
     */

    this.selectedStoreProducts = [];

    this.allSelectedStoreProducts = [];

    this.vendorCategories = [];


    this.isLoading = true;

    this.errorMessage = '';

    this.cdr.detectChanges();


    /*
     * ALL VENDOR PRODUCTS API
     */

    this.productService
      .getAllVendorProducts(productStoreId)
      .subscribe({

        next: (response: ProductPageResponse) => {

          console.log(
            'All Vendor Products API Response:',
            response
          );


          /*
           * Vendor API returns:

           * {
           *   content: Product[],
           *   ...
           * }
           */

          this.allSelectedStoreProducts =
            response?.content ?? [];


          /*
           * Display all vendor products.
           */

          this.selectedStoreProducts =
            [...this.allSelectedStoreProducts];


          /*
           * Build vendor-specific categories.
           */

          this.buildVendorCategories();


          this.isLoading = false;

          this.errorMessage = '';

          this.cdr.detectChanges();

          this.scrollToTop();

        },


        error: (error) => {

          console.error(
            'All Vendor Products API Error:',
            error
          );


          this.allSelectedStoreProducts = [];

          this.selectedStoreProducts = [];

          this.vendorCategories = [];

          this.isLoading = false;

          this.errorMessage =
            error?.error?.message ||
            error?.message ||
            'Unable to load vendor products.';

          this.cdr.detectChanges();

        }

      });


    /*
     * Keep the same Categories route.
     */

    this.router.navigate(
      ['/categories'],
      {
        queryParams: {}
      }
    );

  }


  /* =====================================
     BUILD VENDOR CATEGORIES
  ===================================== */

  private buildVendorCategories(): void {

    const vendorCategoryIds =
      new Set<number>();


    this.allSelectedStoreProducts
      .forEach(
        product => {

          if (
            product.categoryId !== null &&
            product.categoryId !== undefined
          ) {

            vendorCategoryIds.add(
              product.categoryId
            );

          }

        }
      );


    /*
     * Match product category IDs
     * with the global categories list.
     */

    this.vendorCategories =
      this.categories.filter(
        category =>
          vendorCategoryIds.has(
            category.categoryId
          )
      );

  }


  /* =====================================
     BACK TO STORE GROUPS
  ===================================== */

  backToStoreGroups(): void {

    this.isStoreView = false;

    this.selectedStoreName = null;

    this.selectedStoreProducts = [];

    this.allSelectedStoreProducts = [];

    this.selectedCategoryId = null;

    this.vendorCategories = [];


    /*
     * Restore complete initial
     * product list.
     */

    this.products =
      [...this.allProducts];


    this.buildStoreSections();


    this.router.navigate(
      ['/categories'],
      {
        queryParams: {}
      }
    );


    this.scrollToTop();

    this.cdr.detectChanges();

  }


  /* =====================================
     SCROLL TO TOP
  ===================================== */

  private scrollToTop(): void {

    setTimeout(() => {

      const content =
        document.querySelector(
          'ion-content'
        ) as any;


      if (content?.scrollToTop) {

        content.scrollToTop(300);

      }

    }, 50);

  }


  /* =====================================
     OPEN PRODUCT
  ===================================== */

  openProduct(
    product: Product
  ): void {

    if (
      !product?.productStoreId
    ) {

      return;

    }


    this.router.navigate([
      '/product',
      product.productStoreId
    ]);

  }


  /* =====================================
     ADD TO CART
  ===================================== */

  addToCart(
    product: Product
  ): void {

    if (
      !product ||
      !product.productStoreId ||
      product.alreadyAdded
    ) {

      return;

    }


    this.cartService
      .addToCart(
        product.productStoreId,
        1
      )
      .subscribe({

        next: (response) => {

          console.log(
            'Product added to cart:',
            response
          );


          /*
           * Change + to check only
           * after successful API response.
           */

          product.alreadyAdded = true;

          this.cdr.detectChanges();

        },


        error: (error) => {

          console.error(
            'Add to cart failed:',
            error
          );


          /*
           * Keep + enabled if API fails.
           */

          product.alreadyAdded = false;

          this.cdr.detectChanges();

        }

      });

  }


  /* =====================================
     BACK BUTTON
  ===================================== */

handleBack(): void {

  if (this.isStoreView) {
    window.history.back();
    return;
  }

  this.goHome();

}


  /* =====================================
     HOME
  ===================================== */

  goHome(): void {

    if (window.history.length > 1) {

      window.history.back();

    } else {

      this.router.navigate([
        '/home'
      ]);

    }

  }


  /* =====================================
     TRACK STORE
  ===================================== */

  trackStore(
    index: number,
    store: StoreSection
  ): string {

    return store.storeName;

  }


  /* =====================================
     TRACK PRODUCT
  ===================================== */

  trackProduct(
    index: number,
    product: Product
  ): number {

    return product.productStoreId;

  }

}