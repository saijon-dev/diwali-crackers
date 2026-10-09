import {
  ChangeDetectorRef,
  Component,
  OnInit
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
  IonIcon
} from '@ionic/angular';

import { forkJoin } from 'rxjs';

import { addIcons } from 'ionicons';

import {
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


interface StoreSection {
  storeName: string;
  products: Product[];
}


interface CategorySection {
  categoryId: number;
  categoryName: string;
  products: Product[];
}


@Component({
  selector: 'app-categories',
  templateUrl: './categories.page.html',
  standalone: true,
  imports: [
    IonContent,
    IonIcon,
    FloatingCartComponent
  ]
})
export class CategoriesPage implements OnInit {

  categories: Category[] = [];

  vendorCategories: Category[] = [];

  products: Product[] = [];

  allProducts: Product[] = [];

  categorySections: CategorySection[] = [];

  storeSections: StoreSection[] = [];

  selectedCategoryId: number | null = null;

  selectedStoreName: string | null = null;

  isStoreView = false;

  private returnToHome = false;

  selectedStoreProducts: Product[] = [];

  private allSelectedStoreProducts: Product[] = [];

  private pageRequestId = 0;

  isLoading = false;

  errorMessage = '';


  constructor(
    private readonly productService: ProductService,
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef,
    private readonly cartService: CartService,
    private readonly activatedRoute: ActivatedRoute
  ) {

    addIcons({
      imageOutline,
      cartOutline,
      arrowBackOutline,
      homeOutline,
      addOutline,
      checkmarkOutline
    });

  }


  ngOnInit(): void {

    this.returnToHome = history.state?.returnTo === 'home';

    this.activatedRoute.queryParamMap.subscribe(
      params => {

        const categoryIdParam =
          params.get('categoryId');

        const storeIdParam =
          params.get('storeId');


        /*
         * STORE VIEW
         */

        if (storeIdParam !== null) {

          const storeId =
            Number(storeIdParam);

          if (
            Number.isInteger(storeId) &&
            storeId > 0
          ) {

            this.loadStoreProducts(
              storeId
            );

            return;

          }

        }


        /*
         * CATEGORY FROM HOME
         */

        if (categoryIdParam !== null) {

          const categoryId =
            Number(categoryIdParam);

          if (
            Number.isInteger(categoryId) &&
            categoryId > 0
          ) {

            /*
             * If the same category is already
             * displayed, do not reload the API.
             * Just move the selected category
             * chip into the viewport.
             */

            if (
              this.selectedCategoryId === categoryId &&
              this.products.length > 0 &&
              !this.isStoreView
            ) {

              this.cdr.detectChanges();

              this.scrollToCategory(
                categoryId
              );

              return;

            }


            this.isStoreView = false;

            this.selectedCategoryId =
              categoryId;

            this.loadCategoriesAndProducts(
              categoryId
            );

            return;

          }

        }


        /*
         * If already inside store view,
         * do not reset it.
         */

        if (this.isStoreView) {
          return;
        }


        /*
         * NORMAL CATEGORIES PAGE
         */

        if (this.products.length === 0) {

          this.loadCategoriesAndProducts();

          return;

        }


        /*
         * ALL CATEGORIES
         */

        this.selectedCategoryId = null;

        if (this.allProducts.length > 0) {

          this.products =
            [...this.allProducts];

          this.buildStoreSections();

          this.cdr.detectChanges();

        } else {

          this.loadProducts();

        }

      }
    );

  }


  /*
   * Scroll a category selected from Home
   * into the horizontal category viewport.
   */

  private scrollToCategory(
    categoryId: number
  ): void {

    requestAnimationFrame(() => {

      requestAnimationFrame(() => {

        const categoryButton =
          document.querySelector(
            `[data-category-id="${categoryId}"]`
          ) as HTMLElement | null;

        if (!categoryButton) {
          return;
        }

        categoryButton.scrollIntoView({
          behavior: 'smooth',
          inline: 'center',
          block: 'nearest'
        });

      });

    });

  }


  /*
   * LOAD CATEGORIES AND PRODUCTS
   */

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

          this.categories =
            Array.isArray(response)
              ? response
              : (response?.content ?? []);


          /*
           * CATEGORY SELECTED FROM HOME
           */

          if (
            categoryId !== undefined &&
            categoryId !== null
          ) {

            this.selectedCategoryId =
              categoryId;

            /*
             * Render the category chips first.
             */

            this.cdr.detectChanges();

            /*
             * Move the selected category
             * into the horizontal viewport.
             */

            this.scrollToCategory(
              categoryId
            );

            /*
             * Load products for that category.
             */

            this.loadProductsByCategory(
              categoryId
            );

            return;

          }


          /*
           * ALL CATEGORIES
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


  /*
   * LOAD STORE PRODUCTS
   */

  private loadStoreProducts(
    storeId: number
  ): void {

    this.isStoreView = true;

    this.isLoading = true;

    this.errorMessage = '';

    this.selectedCategoryId = null;

    this.selectedStoreProducts = [];

    this.allSelectedStoreProducts = [];

    this.vendorCategories = [];

    /*
     * Clear the global category list while
     * vendor-specific categories are loading.
     */

    this.categories = [];

    this.selectedStoreName = '';

    this.fetchStoreProducts(
      storeId
    );

  }


  /*
   * FETCH STORE PRODUCTS
   */

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

        next: response => {

          const products =
            response?.content ?? [];

          this.selectedStoreProducts =
            products;

          this.allSelectedStoreProducts =
            [...products];

          this.selectedStoreName =
            products[0]?.storeName ??
            'Vendor Products';


          /*
           * Get productStoreId from any
           * product belonging to this vendor.
           */

          const productStoreId =
            products.find(
              product =>
                product.productStoreId != null
            )?.productStoreId;

          if (!productStoreId) {

            this.vendorCategories = [];

            this.categories = [];

            this.selectedCategoryId = null;

            this.buildVendorCategories();

            this.isLoading = false;

            this.cdr.detectChanges();

            return;

          }


          /*
           * Load categories belonging
           * specifically to this product store.
           */

          this.productService
            .getCategoriesByProductStore(
              productStoreId
            )
            .subscribe({

              next: vendorCategories => {

                this.vendorCategories =
                  vendorCategories ?? [];

                this.categories =
                  this.vendorCategories;

                /*
                 * All Categories selected initially.
                 */

                this.selectedCategoryId = null;

                /*
                 * Keep all vendor products
                 * available for category switching.
                 */

                this.allSelectedStoreProducts =
                  [...products];

                this.selectedStoreProducts =
                  [...products];

                this.isLoading = false;

                this.cdr.detectChanges();

              },

              error: error => {

                console.error(
                  'Failed to load vendor categories:',
                  error
                );

                /*
                 * Products can still be displayed
                 * even if vendor categories fail.
                 */

                this.vendorCategories = [];

                this.categories = [];

                this.selectedCategoryId = null;

                this.selectedStoreProducts =
                  [...products];

                this.allSelectedStoreProducts =
                  [...products];

                this.isLoading = false;

                this.cdr.detectChanges();

              }

            });

        },

        error: error => {

          console.error(
            'Failed to load vendor products:',
            error
          );

          this.selectedStoreProducts = [];

          this.allSelectedStoreProducts = [];

          this.vendorCategories = [];

          this.categories = [];

          this.selectedCategoryId = null;

          this.isLoading = false;

          this.errorMessage =
            'Unable to load vendor products.';

          this.cdr.detectChanges();

        }

      });

    /*
     * Keep category/store navigation from creating
     * unnecessary browser history entries.
     */

    this.router.navigate(
      ['/categories'],
      {
        queryParams: {},
        replaceUrl: true
      }
    );

  }


  /*
   * LOAD ALL PRODUCTS
   */

private loadProducts(): void {

  const requestId =
    ++this.pageRequestId;

  this.isLoading = true;
  this.errorMessage = '';

  /*
   * First request.
   * We use a larger page size so that
   * most products can be loaded in fewer requests.
   */
  this.productService
    .getProducts(0, 50)
    .subscribe({

      next: (firstResponse: ProductPageResponse) => {

        /*
         * Ignore stale response if user
         * selected another category meanwhile.
         */
        if (
          requestId !== this.pageRequestId
        ) {
          return;
        }

        const firstProducts =
          firstResponse?.content ?? [];

        const totalPages =
          firstResponse?.totalPages ?? 1;

        /*
         * If everything fits in the first page,
         * use it directly.
         */
        if (totalPages <= 1) {

          this.allProducts =
            [...firstProducts];

          this.products =
            [...this.allProducts];

          this.buildStoreSections();

          this.selectedCategoryId = null;
          this.isLoading = false;
          this.errorMessage = '';

          this.cdr.detectChanges();

          return;
        }

        /*
         * More pages exist.
         *
         * Load pages 1...N and combine
         * everything into one product list.
         */
        const remainingRequests = [];

        for (
          let page = 1;
          page < totalPages;
          page++
        ) {
          remainingRequests.push(
            this.productService.getProducts(
              page,
              50
            )
          );
        }

        /*
         * Import forkJoin from rxjs if it is
         * not already imported.
         */
        forkJoin(remainingRequests)
          .subscribe({

            next: (
              responses: ProductPageResponse[]
            ) => {

              if (
                requestId !== this.pageRequestId
              ) {
                return;
              }

              const remainingProducts =
                responses.flatMap(
                  response =>
                    response?.content ?? []
                );

              /*
               * Combine page 0 + all remaining pages.
               */
              this.allProducts = [
                ...firstProducts,
                ...remainingProducts
              ];

              /*
               * Remove accidental duplicate
               * product-store entries.
               */
              const uniqueProducts =
                new Map<number, Product>();

              this.allProducts.forEach(
                product => {

                  if (
                    product?.productStoreId != null
                  ) {
                    uniqueProducts.set(
                      product.productStoreId,
                      product
                    );
                  }

                }
              );

              this.allProducts =
                Array.from(
                  uniqueProducts.values()
                );

              this.products =
                [...this.allProducts];

              /*
               * Now group ALL products
               * by store.
               */
              this.buildStoreSections();

              this.selectedCategoryId = null;
              this.isLoading = false;
              this.errorMessage = '';

              this.cdr.detectChanges();
            },

            error: (error) => {

              if (
                requestId !== this.pageRequestId
              ) {
                return;
              }

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

      },

      error: (error) => {

        if (
          requestId !== this.pageRequestId
        ) {
          return;
        }

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

  /*
   * LOAD PRODUCTS BY CATEGORY
   */

  private loadProductsByCategory(
    categoryId: number
  ): void {

    /*
     * Create a new request generation.
     *
     * This invalidates any previous
     * All Products or Category Products request.
     */

    const requestId =
      ++this.pageRequestId;

    this.isLoading = true;

    this.errorMessage = '';

    this.productService
      .getProductsByCategory(
        categoryId
      )
      .subscribe({

        next: (
          response: ProductPageResponse
        ) => {

          /*
           * If another navigation/category
           * selection happened after this request
           * started, ignore this response.
           */

          if (
            requestId !==
            this.pageRequestId
          ) {
            return;
          }

          console.log(
            'Category Products API Response:',
            response
          );

          this.products =
            response?.content ?? [];

          console.log(
            'Category Products:',
            this.products
          );

          /*
           * Keep the selected category.
           */

          this.selectedCategoryId =
            categoryId;

          /*
           * Group category products by store.
           */

          this.buildStoreSections();

          this.isLoading = false;

          this.errorMessage = '';

          this.cdr.detectChanges();

        },

        error: (error) => {

          /*
           * Ignore errors from stale requests.
           */

          if (
            requestId !==
            this.pageRequestId
          ) {
            return;
          }

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


  /*
   * GROUP PRODUCTS BY STORE
   */

  buildStoreSections(): void {

    if (!Array.isArray(this.products)) {

      console.error(
        'Products is not an array:',
        this.products
      );

      this.products = [];

    }


    const filteredProducts =
      [...this.products];

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


  /*
   * CATEGORY CHANGE
   *
   * NORMAL VIEW:
   *     API request
   *
   * STORE VIEW:
   *     local filtering
   */

  selectCategory(
    categoryId: number | null
  ): void {

    this.selectedCategoryId =
      categoryId;

    this.pageRequestId++;


    /*
     * VENDOR PRODUCTS VIEW
     */

    if (this.isStoreView) {

      if (categoryId === null) {

        this.selectedStoreProducts =
          [
            ...this.allSelectedStoreProducts
          ];

      } else {

        this.selectedStoreProducts =
          this.allSelectedStoreProducts.filter(
            product =>
              product.categoryId ===
              categoryId
          );

      }

      this.cdr.detectChanges();

      return;

    }


    /*
     * NORMAL CATEGORIES VIEW
     */

    if (categoryId === null) {

      /*
       * Invalidate every category API request
       * that is currently running.
       */

      this.isStoreView = false;

      this.selectedStoreName = '';

      this.selectedStoreProducts = [];

      this.selectedCategoryId = null;

      this.router.navigate(
        ['/categories'],
        {
          queryParams: {},
          replaceUrl: true
        }
      );

      if (this.allProducts.length > 0) {

        this.products =
          [...this.allProducts];

        this.buildStoreSections();

        this.isLoading = false;

        this.cdr.detectChanges();

      } else {

        this.loadProducts();

      }

      return;

    }


    this.isStoreView = false;

    this.selectedStoreName = '';

    this.selectedStoreProducts = [];

    this.router.navigate(
      ['/categories'],
      {
        queryParams: {
          categoryId
        },
        replaceUrl: true
      }
    );

    this.loadProductsByCategory(
      categoryId
    );

  }


  /*
   * VIEW ALL PRODUCTS OF ONE STORE
   */

  viewAllStore(
    store: StoreSection
  ): void {

    if (!store?.products?.length) {
      return;
    }

    this.isStoreView = true;

    this.isLoading = true;

    this.errorMessage = '';

    this.selectedCategoryId = null;

    this.selectedStoreName =
      store.storeName;

    this.selectedStoreProducts = [];

    this.allSelectedStoreProducts = [];

    this.vendorCategories = [];

    this.categories = [];


    /*
     * Get productStoreId from any product
     * belonging to this vendor.
     */

    const productStoreId =
      store.products.find(
        product =>
          product.productStoreId != null
      )?.productStoreId;


    /*
     * First load all products belonging
     * to this vendor.
     */

    this.productService
      .getAllVendorProducts(
        productStoreId ?? 0
      )
      .subscribe({

        next: response => {

          const products =
            response?.content ?? [];

          this.selectedStoreProducts =
            [...products];

          this.allSelectedStoreProducts =
            [...products];


          /*
           * Use productStoreId from the
           * returned vendor products if the
           * first lookup didn't provide one.
           */

          const vendorProductStoreId =
            productStoreId ??
            products.find(
              product =>
                product.productStoreId != null
            )?.productStoreId;

          if (!vendorProductStoreId) {

            this.vendorCategories = [];

            this.categories = [];

            this.selectedCategoryId = null;

            this.isLoading = false;

            this.cdr.detectChanges();

            return;

          }


          /*
           * Load ONLY categories belonging
           * to this vendor's product store.
           */

          this.productService
            .getCategoriesByProductStore(
              vendorProductStoreId
            )
            .subscribe({

              next: categories => {

                this.vendorCategories =
                  categories ?? [];

                this.categories =
                  this.vendorCategories;

                this.selectedCategoryId = null;

                this.isLoading = false;

                this.cdr.detectChanges();

              },

              error: error => {

                console.error(
                  'Failed to load vendor categories:',
                  error
                );

                this.vendorCategories = [];

                this.categories = [];

                this.selectedCategoryId = null;

                this.isLoading = false;

                this.cdr.detectChanges();

              }

            });

        },

        error: error => {

          console.error(
            'Failed to load vendor products:',
            error
          );

          this.selectedStoreProducts = [];

          this.allSelectedStoreProducts = [];

          this.vendorCategories = [];

          this.categories = [];

          this.selectedCategoryId = null;

          this.isLoading = false;

          this.errorMessage =
            'Unable to load vendor products.';

          this.cdr.detectChanges();

        }

      });


    /*
     * Keep category/store navigation from
     * creating unnecessary browser history entries.
     */

    this.router.navigate(
      ['/categories'],
      {
        queryParams: {},
        replaceUrl: true
      }
    );

  }


  /*
   * BUILD CATEGORIES AVAILABLE
   * FOR CURRENT STORE
   */

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

    this.vendorCategories =
      this.categories.filter(
        category =>
          vendorCategoryIds.has(
            category.categoryId
          )
      );

  }


  /*
   * BACK TO STORE GROUPS
   */

  backToStoreGroups(): void {

    this.isStoreView = false;

    this.selectedStoreName = null;

    this.selectedStoreProducts = [];

    this.allSelectedStoreProducts = [];

    this.selectedCategoryId = null;

    this.vendorCategories = [];

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


  /*
   * SCROLL TO TOP
   */

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


  /*
   * OPEN PRODUCT
   */

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


  /*
   * ADD TO CART
   */

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

          product.alreadyAdded = true;

          this.cdr.detectChanges();

        },

        error: (error) => {

          console.error(
            'Add to cart failed:',
            error
          );

          product.alreadyAdded = false;

          this.cdr.detectChanges();

        }

      });

  }


  /*
   * BACK BUTTON
   */
handleBack(): void {

  // Vendor Products opened from Home
  if (this.returnToHome) {
    this.returnToHome = false;
    this.router.navigate(['/home']);
    return;
  }

  // Vendor Products opened from Categories tab
  if (this.isStoreView) {
    this.backToStoreGroups();
    return;
  }

  // Normal Categories view
  this.router.navigate(['/home']);
}





  /*
   * TRACK STORE
   */

  trackStore(
    index: number,
    store: StoreSection
  ): string {

    return store.storeName;

  }


  /*
   * TRACK PRODUCT
   */

  trackProduct(
    index: number,
    product: Product
  ): number {

    return product.productStoreId;

  }

private readonly productBadgeMap = new Map<number, string>();
  getProductBadge(product: Product): string {
    const productKey = product.productStoreId;
  
    const existingBadge = this.productBadgeMap.get(productKey);
  
    if (existingBadge) {
      return existingBadge;
    }
  
    const badge =
      Math.random() < 0.5
        ? 'assets/images/15-badge.png'
        : 'assets/images/20-badge.png';
  
    this.productBadgeMap.set(productKey, badge);
  
    return badge;
  }

}