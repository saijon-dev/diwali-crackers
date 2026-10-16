import {
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit
} from '@angular/core';




import {
  FormsModule
} from '@angular/forms';

import { ElementRef, ViewChild } from '@angular/core';
import {
  IonBadge,
  IonButton,
  IonContent,
  IonIcon,
  IonPopover,
  IonSearchbar,
  IonRefresher,
  IonRefresherContent,
  Platform
} from '@ionic/angular';

import {
  addIcons
} from 'ionicons';

import {
  addOutline,
  arrowBackOutline,
  cartOutline,
  closeOutline,
  imageOutline,
  receiptOutline,
  searchOutline,
  arrowForwardOutline,
  locationOutline,
  personCircleOutline,
  storefrontOutline
} from 'ionicons/icons';

import {
  Router
} from '@angular/router';

import { Subscription, finalize, interval, take } from 'rxjs';

import {
  Category,
  Product,
  ProductService
} from '../../services/product.service';

import { LocationService } from '../../services/location.service';

import {
  CartService
} from '../../services/cart.service';

import {
  StoreVendor,
  VendorService
} from '../../services/vendor.service';

import {
  FloatingCartComponent
} from '../../components/floating-cart/floating-cart.component';

interface ComboProduct {
  productId: number;
  productStoreId?: number;
  productName: string;
  quantity: number;
  imageUrl?: string;
}

interface ComboOffer {
  comboId: number;
  comboName: string;
  description: string;
  comboImageUrl?: string;
  comboSellingPrice: number;
  totalActualPrice: number;
  discountPercentage: number;

  vendor: {
    vendorId: number;
    storeName: string;
    city?: string;
  };

  products: ComboProduct[];
  isAvailable: boolean;
}


@Component({
  selector: 'app-home',

  templateUrl: './home.page.html',

  standalone: true,

  imports: [
    FormsModule,

    IonContent,
    IonSearchbar,
    IonIcon,
    IonButton,
    IonBadge,
    IonPopover,
    IonRefresher,
    IonRefresherContent,


    FloatingCartComponent
  ]
})
export class HomePage
  implements OnInit, OnDestroy {


  /* ====================================================
     SEARCH
  ==================================================== */
isSearchMode = false;
searchText = '';
searchResults: Product[] = [];
isSearching = false;
hasSearched = false;
errorMessage = '';
currentPage = 0;
pageSize = 18;
totalResults = 0;

private searchRequestId = 0;


  /* ====================================================
     NEW ARRIVALS PAGINATION
  ==================================================== */

 /* ====================================================
   NEW ARRIVALS PAGINATION
==================================================== */

productsPage = 0;

productsPageSize = 12;

productsTotalPages = 0;

isChangingProductPage = false;


  /* ====================================================
     RECENT SEARCHES
  ==================================================== */

  recentSearches: string[] = [];


  /* ====================================================
     POPULAR SEARCHES
  ==================================================== */

  popularSearches: string[] = [
    'Sparklers',
    'Flower Pots',
    'Rockets',
    'Chakkars',
    'Gift Boxes',
    'Launchers'
  ];


  /* ====================================================
     CATEGORIES
  ==================================================== */

  categories: Category[] = [];

  isLoadingCategories = false;

  categoryErrorMessage = '';


  /* ====================================================
     VENDORS
  ==================================================== */

  vendors: StoreVendor[] = [];

  isVendorsLoading = false;

  vendorErrorMessage = '';





  /* ====================================================
   COMBO OFFERS
==================================================== */

isCombosLoading = false;
comboErrorMessage = '';

combos: ComboOffer[] = [];

showComboDetails = false;
selectedCombo: ComboOffer | null = null;

/*
 * Temporary data until the customer combos GET API
 * is connected. Replace this with the API response.
 */
private readonly mockCombos: ComboOffer[] = [
  {
    comboId: 501,
    comboName: 'Kids Fun Combo',
    description:
      'A festive collection for a joyful Diwali celebration.',
    comboImageUrl: '',
    comboSellingPrice: 399,
    totalActualPrice: 500,
    discountPercentage: 20,
    vendor: {
      vendorId: 7,
      storeName: 'Sri Venkata Ram Crackers',
      city: 'Hyderabad'
    },
    products: [
      {
        productId: 101,
        productStoreId: 101,
        productName: '7 cm Sparklers',
        quantity: 1,
        imageUrl: 'assets/images/product-placeholder.png'
      },
      {
        productId: 102,
        productStoreId: 102,
        productName: 'Flower Pots',
        quantity: 1,
        imageUrl: 'assets/images/product-placeholder.png'
      },
      {
        productId: 103,
        productStoreId: 103,
        productName: 'Chakra',
        quantity: 1,
        imageUrl: 'assets/images/product-placeholder.png'
      }
    ],
    isAvailable: true
  },
  {
    comboId: 502,
    comboName: 'Family Celebration Combo',
    description:
      'A festive selection for the whole family.',
    comboImageUrl: '',
    comboSellingPrice: 595,
    totalActualPrice: 700,
    discountPercentage: 15,
    vendor: {
      vendorId: 8,
      storeName: 'Pavan Fireworks Store',
      city: 'Hyderabad'
    },
    products: [
      {
        productId: 104,
        productStoreId: 104,
        productName: 'Sky Rockets',
        quantity: 1,
        imageUrl: 'assets/images/product-placeholder.png'
      },
      {
        productId: 105,
        productStoreId: 105,
        productName: 'Flower Pots',
        quantity: 1,
        imageUrl: 'assets/images/product-placeholder.png'
      }
    ],
    isAvailable: true
  },
  {
    comboId: 503,
    comboName: 'Grand Diwali Combo',
    description:
      'A special combination of festive favourites.',
    comboSellingPrice: 799,
    totalActualPrice: 999,
    discountPercentage: 20,
    vendor: {
      vendorId: 9,
      storeName: 'Lakshmi Crackers',
      city: 'Hyderabad'
    },
    products: [
      {
        productId: 106,
        productStoreId: 106,
        productName: 'Sparklers',
        quantity: 2,
        imageUrl: 'assets/images/product-placeholder.png'
      },
      {
        productId: 107,
        productStoreId: 107,
        productName: 'Ground Chakkar',
        quantity: 1,
        imageUrl: 'assets/images/product-placeholder.png'
      }
    ],
    isAvailable: true
  }
];


  /* ====================================================
     PRODUCTS
  ==================================================== */

  products: Product[] = [];

  isLoadingProducts = false;

  productErrorMessage = '';


  /* ====================================================
     CART
  ==================================================== */

  cartCount = 0;

  private cartSubscription?: Subscription;
  private comboBackSubscription?: Subscription;


  constructor(
    private readonly router: Router,

    private readonly productService: ProductService,

    private readonly cartService: CartService,

    private readonly vendorService: VendorService,

    private readonly cdr: ChangeDetectorRef,

    private readonly platform: Platform,

    private readonly locationService: LocationService
  ) {

    addIcons({

      imageOutline,

      cartOutline,

      receiptOutline,

      addOutline,

      arrowBackOutline,

      searchOutline,

      closeOutline,

      arrowForwardOutline,

      locationOutline,

      personCircleOutline,

      storefrontOutline

    });

  }




  /* ====================================================
   COMBO IMAGE CAROUSEL
==================================================== */

activeComboImageIndex = 0;

private comboImageTimer?: Subscription;

private readonly comboImageIntervalMs = 3000;

private startComboImageTimer(): void {
  this.stopComboImageTimer();

  if (
    !this.showComboDetails ||
    !this.selectedCombo ||
    this.selectedCombo.products.length <= 1
  ) {
    return;
  }

  this.comboImageTimer = interval(
    this.comboImageIntervalMs
  ).subscribe(() => {
    this.nextComboImage(false);
  });
}

private stopComboImageTimer(): void {
  this.comboImageTimer?.unsubscribe();
  this.comboImageTimer = undefined;
}

private resetComboImageTimer(): void {
  this.startComboImageTimer();
}

nextComboImage(resetTimer = true): void {
  const products = this.selectedCombo?.products ?? [];

  if (products.length <= 1) {
    return;
  }

  this.activeComboImageIndex =
    (this.activeComboImageIndex + 1) % products.length;

  if (resetTimer) {
    this.resetComboImageTimer();
  }

  this.cdr.detectChanges();
}

previousComboImage(): void {
  const products = this.selectedCombo?.products ?? [];

  if (products.length <= 1) {
    return;
  }

  this.activeComboImageIndex =
    (this.activeComboImageIndex - 1 + products.length) %
    products.length;

  this.resetComboImageTimer();
  this.cdr.detectChanges();
}


  /* ====================================================
     INIT
  ==================================================== */

  ngOnInit(): void {

    this.loadRecentSearches();

    this.loadCategories();

    this.loadVendors();

    this.loadProducts(0);
    this.loadCombos();

    this.cartSubscription =
      this.cartService.cart$
        .subscribe(cart => {

          this.cartCount =
            Number(
              cart?.totalItems ?? 0
            );

          this.cdr.detectChanges();

        });

        this.comboBackSubscription =
  this.platform.backButton.subscribeWithPriority(
    20,
    () => {
      if (this.showComboDetails) {
        this.closeComboDetails();
      }
    }
  );

  }


  /* ====================================================
     DESTROY
  ==================================================== */

  ngOnDestroy(): void {

    this.cartSubscription?.unsubscribe();
    this.comboBackSubscription?.unsubscribe();
    this.stopComboImageTimer();

  }


  /* ====================================================
   PULL TO REFRESH
==================================================== */

handleRefresh(event: CustomEvent): void {

  const refresher =
    event.target as HTMLIonRefresherElement;

  // Search mode should not refresh the Home screen.
  if (this.isSearchMode) {
    void refresher.complete();
    return;
  }

  // Do not start a duplicate product request.
  if (this.isChangingProductPage) {
    void refresher.complete();
    return;
  }

  // Reset errors before refreshing.
  this.categoryErrorMessage = '';
  this.vendorErrorMessage = '';
  this.productErrorMessage = '';

  // Start refreshing the Home data.
  this.loadCategories();
  this.loadVendors();
  this.loadProducts(0);
  this.loadCombos();

  /*
   * Wait for the three loaders to finish.
   * Each loader sets its loading flag to false
   * in both success and error callbacks.
   */
  const refreshSubscription = interval(100).subscribe(() => {

    const categoriesFinished =
      !this.isLoadingCategories;

    const vendorsFinished =
      !this.isVendorsLoading;

    const productsFinished =
      !this.isChangingProductPage &&
      !this.isLoadingProducts;

    if (
      categoriesFinished &&
      vendorsFinished &&
      productsFinished
    ) {

      refreshSubscription.unsubscribe();

      void refresher.complete();
    }

  });

}


  /* ====================================================
     SEARCH MODE
  ==================================================== */

 openSearch(): void {

  this.isSearchMode = true;

  this.hasSearched = false;

  this.isSearching = false;

  this.errorMessage = '';

  this.searchResults = [];

  this.totalResults = 0;

  this.loadRecentSearches();

  this.cdr.detectChanges();

}


  /* ====================================================
     CLOSE SEARCH
  ==================================================== */

  closeSearch(): void {

    this.isSearchMode = false;

    this.searchText = '';

    this.searchResults = [];

    this.hasSearched = false;

    this.isSearching = false;

    this.errorMessage = '';

    this.totalResults = 0;

  }





  @ViewChild('categoryScroller')
categoryScroller!: ElementRef<HTMLElement>;

centeredCategoryId: number | null = null;

onCategoryScroll(): void {
  const scroller = this.categoryScroller?.nativeElement;

  if (!scroller) {
    return;
  }

  const cards = scroller.querySelectorAll<HTMLElement>(
    '.category-card'
  );

  if (cards.length === 0) {
    return;
  }

  const scrollerRect = scroller.getBoundingClientRect();
  const centerX = scrollerRect.left + scrollerRect.width / 2;

  let closestCard: HTMLElement | undefined;
  let closestDistance = Number.POSITIVE_INFINITY;

  cards.forEach((card: HTMLElement) => {
    const rect = card.getBoundingClientRect();
    const cardCenter = rect.left + rect.width / 2;
    const distance = Math.abs(centerX - cardCenter);

    if (distance < closestDistance) {
      closestDistance = distance;
      closestCard = card;
    }
  });

  if (!closestCard) {
    return;
  }

  const categoryId = closestCard.getAttribute('data-category-id');

  if (categoryId !== null) {
    this.centeredCategoryId = Number(categoryId);
  }
}


private centerInitialCategory(): void {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const scroller = this.categoryScroller?.nativeElement;

      if (!scroller || this.categories.length === 0) {
        return;
      }

      // Center the second category initially.
      const initialCategory = this.categories[1] ?? this.categories[0];

      const categoryCard = scroller.querySelector<HTMLElement>(
        `[data-category-id="${initialCategory.categoryId}"]`
      );

      if (!categoryCard) {
        return;
      }

      const scrollerRect = scroller.getBoundingClientRect();
      const cardRect = categoryCard.getBoundingClientRect();

      const cardCenter =
        cardRect.left - scrollerRect.left + cardRect.width / 2;

      scroller.scrollLeft += cardCenter - scroller.clientWidth / 2;

      this.centeredCategoryId = initialCategory.categoryId;

      this.cdr.detectChanges();
    });
  });
}

  /* ====================================================
     LOAD RECENT SEARCHES
  ==================================================== */

  loadRecentSearches(): void {

    const stored =
      localStorage.getItem(
        'recentSearches'
      );


    if (!stored) {

      this.recentSearches = [];

      return;

    }


    try {

      const parsed =
        JSON.parse(stored);


      this.recentSearches =
        Array.isArray(parsed)
          ? parsed
          : [];

    } catch {

      this.recentSearches = [];

    }

  }


  /* ====================================================
     SAVE RECENT SEARCH
  ==================================================== */

  saveRecentSearch(
    search: string
  ): void {

    const value =
      search.trim();


    if (!value) {
      return;
    }


    this.recentSearches =
      this.recentSearches.filter(
        item =>
          item.toLowerCase() !==
          value.toLowerCase()
      );


    this.recentSearches.unshift(
      value
    );


    this.recentSearches =
      this.recentSearches.slice(
        0,
        5
      );


    localStorage.setItem(
      'recentSearches',
      JSON.stringify(
        this.recentSearches
      )
    );

  }


  /* ====================================================
     SEARCH PRODUCTS
  ==================================================== */
/* ====================================================
   SEARCH PRODUCTS
==================================================== */

searchProducts(
  searchValue?: string
): void {

  const value =
    (
      searchValue ??
      this.searchText
    ).trim();


  if (!value) {

    this.searchResults = [];

    this.hasSearched = false;

    this.isSearching = false;

    this.errorMessage = '';

    this.totalResults = 0;

    this.cdr.detectChanges();

    return;
  }


  /*
   * Create a unique ID for this search.
   *
   * This prevents an older API response from
   * changing the state of a newer search.
   */

  const requestId =
    ++this.searchRequestId;


  this.searchText = value;

  this.currentPage = 0;

  this.hasSearched = true;

  this.isSearching = true;

  this.errorMessage = '';

  this.searchResults = [];

  this.totalResults = 0;


  this.saveRecentSearch(value);


  /*
   * Immediately show the loader.
   */

  this.cdr.detectChanges();


  this.productService
    .searchProducts(
      value,
      this.currentPage,
      this.pageSize
    )
    .subscribe({

      next: response => {

        console.log(
          'SEARCH NEXT RECEIVED:',
          response
        );


        /*
         * Ignore response from an older search.
         */

        if (
          requestId !==
          this.searchRequestId
        ) {

          return;

        }


        this.searchResults =
          response?.content ?? [];


        this.totalResults =
          response?.totalElements ??
          this.searchResults.length;


        /*
         * Give Angular the completed
         * response state on the next
         * event-loop cycle.
         */

        setTimeout(() => {

          if (
            requestId !==
            this.searchRequestId
          ) {

            return;

          }


          this.isSearching = false;


          console.log(
            'SEARCH LOADING STOPPED:',
            this.isSearching
          );


          this.cdr.detectChanges();

        }, 0);

      },


      error: error => {

        console.error(
          'Search Products Error:',
          error
        );


        if (
          requestId !==
          this.searchRequestId
        ) {

          return;

        }


        this.searchResults = [];

        this.totalResults = 0;

        this.errorMessage =
          error?.error?.message ||
          error?.message ||
          'Unable to search products.';


        setTimeout(() => {

          if (
            requestId !==
            this.searchRequestId
          ) {

            return;

          }


          this.isSearching = false;


          console.log(
            'SEARCH LOADING STOPPED AFTER ERROR:',
            this.isSearching
          );


          this.cdr.detectChanges();

        }, 0);

      }

    });

}


  /* ====================================================
     RECENT SEARCH
  ==================================================== */

  selectRecentSearch(
    search: string
  ): void {

    this.searchText = search;

    this.searchProducts(search);

  }


  /* ====================================================
     POPULAR SEARCH
  ==================================================== */

  selectPopularSearch(
    search: string
  ): void {

    this.searchText = search;

    this.searchProducts(search);

  }


  /* ====================================================
     CLEAR SEARCH
  ==================================================== */

  clearSearch(): void {

    this.searchText = '';

    this.searchResults = [];

    this.hasSearched = false;

    this.isSearching = false;

    this.totalResults = 0;

    this.errorMessage = '';

  }


  /* ====================================================
     REMOVE RECENT SEARCH
  ==================================================== */

  removeRecentSearch(
    search: string,
    event: Event
  ): void {

    event.stopPropagation();


    this.recentSearches =
      this.recentSearches.filter(
        item =>
          item !== search
      );


    localStorage.setItem(
      'recentSearches',
      JSON.stringify(
        this.recentSearches
      )
    );

  }


  /* ====================================================
     CLEAR RECENT SEARCHES
  ==================================================== */

  clearRecentSearches(): void {

    this.recentSearches = [];

    localStorage.removeItem(
      'recentSearches'
    );

  }


  /* ====================================================
     LOAD CATEGORIES
  ==================================================== */

  loadCategories(): void {

    this.isLoadingCategories = true;

    this.categoryErrorMessage = '';

    this.cdr.detectChanges();

    this.productService
      .getCategories()
      .subscribe({

      
next: response => {
  this.categories = response ?? [];

  this.isLoadingCategories = false;

  this.cdr.detectChanges();

  // Initially center the second category after rendering.
  this.centerInitialCategory();
},

        error: error => {

          console.error(
            'Categories API Error:',
            error
          );

          this.categories = [];

          this.isLoadingCategories =
            false;

          this.categoryErrorMessage =
            error?.error?.message ||
            error?.message ||
            'Unable to load categories.';

          this.cdr.detectChanges();

        }

      });

  }


  /* ====================================================
     LOAD VENDORS
  ==================================================== */

  loadVendors(): void {

    this.isVendorsLoading = true;

    this.vendorErrorMessage = '';

    this.cdr.detectChanges();

    this.vendorService
      .getStores(0, 10)
      .subscribe({

        next: response => {

          this.vendors =
            response?.content ?? [];

          this.isVendorsLoading =
            false;

          this.cdr.detectChanges();

        },

        error: error => {

          console.error(
            'Vendors API Error:',
            error
          );

          this.vendors = [];

          this.isVendorsLoading =
            false;

          this.vendorErrorMessage =
            error?.error?.message ||
            error?.message ||
            'Unable to load vendors.';

          this.cdr.detectChanges();

        }

      });

  }


  /* ====================================================
     LOAD PRODUCTS
  ==================================================== */
/* ====================================================
   LOAD PRODUCTS
==================================================== */

loadProducts(
  page: number = 0
): void {

  if (page < 0) {
    page = 0;
  }


  if (
    this.productsTotalPages > 0 &&
    page >= this.productsTotalPages
  ) {

    return;

  }


  if (this.isChangingProductPage) {
    return;
  }


  this.isChangingProductPage = true;

  this.productErrorMessage = '';


  /*
   * Show the main loader only for the
   * first product request.
   */

  if (
    page === 0 &&
    this.products.length === 0
  ) {

    this.isLoadingProducts = true;

  }


  this.cdr.detectChanges();


  this.productService
    .getProducts(
      page,
      this.productsPageSize
    )
    .subscribe({

      next: response => {

        const newProducts =
          response?.content ?? [];


        /*
         * First page:
         * replace the existing list.
         */

        if (page === 0) {

          this.products =
            [...newProducts];

        }


        /*
         * Next pages:
         * append new products.
         *
         * productStoreId prevents
         * accidental duplicates.
         */

        else {

          const existingIds =
            new Set(
              this.products.map(
                product =>
                  Number(
                    product.productStoreId
                  )
              )
            );


          const productsToAppend =
            newProducts.filter(
              product =>
                !existingIds.has(
                  Number(
                    product.productStoreId
                  )
                )
            );


          this.products = [
            ...this.products,
            ...productsToAppend
          ];

        }


        this.productsPage =
          response?.number ?? page;


        this.productsTotalPages =
          response?.totalPages ?? 0;


        this.isLoadingProducts =
          false;


        this.isChangingProductPage =
          false;


        this.productErrorMessage = '';


        this.cdr.detectChanges();

      },


      error: error => {

        console.error(
          'Products API Error:',
          error
        );


        this.isLoadingProducts = false;

        this.isChangingProductPage = false;


        this.productErrorMessage =
          error?.error?.message ||
          error?.message ||
          'Unable to load products.';


        this.cdr.detectChanges();

      }

    });

}


  /* ====================================================
     NEXT PRODUCTS PAGE
  ==================================================== */
/* ====================================================
   SEE MORE PRODUCTS
==================================================== */

nextProductsPage(): void {

  if (this.isChangingProductPage) {
    return;
  }


  if (
    this.productsTotalPages <= 0 ||
    this.productsPage >=
      this.productsTotalPages - 1
  ) {

    return;

  }


  this.loadProducts(
    this.productsPage + 1
  );

}


  /* ====================================================
     PREVIOUS PRODUCTS PAGE
  ==================================================== */

  previousProductsPage(): void {

    if (this.isChangingProductPage) {
      return;
    }


    if (this.productsPage <= 0) {
      return;
    }


    this.loadProducts(
      this.productsPage - 1
    );


    this.scrollToNewArrivals();

  }


  /* ====================================================
     SPECIFIC PRODUCTS PAGE
  ==================================================== */

  goToProductsPage(
    page: number
  ): void {

    if (this.isChangingProductPage) {
      return;
    }


    if (
      page < 0 ||
      page >= this.productsTotalPages
    ) {

      return;

    }


    if (page === this.productsPage) {
      return;
    }


    this.loadProducts(page);

    this.scrollToNewArrivals();

  }


  /* ====================================================
     SCROLL TO NEW ARRIVALS
  ==================================================== */

  private scrollToNewArrivals(): void {

    setTimeout(() => {

      const element =
        document.getElementById(
          'new-arrivals'
        );


      if (!element) {
        return;
      }


      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });

    }, 50);

  }


  /* ====================================================
     PRODUCT CART STATE
  ==================================================== */

  isProductAdded(
    productStoreId: number
  ): boolean {

    const product =
      this.findProduct(
        productStoreId
      );


    if (
      product?.alreadyAdded === true
    ) {

      return true;

    }


    return this.cartService
      .isProductInCart(
        productStoreId
      );

  }


  private findProduct(
    productStoreId: number
  ): Product | undefined {

    const id =
      Number(productStoreId);


    return this.products.find(
      product =>
        Number(product.productStoreId) === id
    );

  }


  /* ====================================================
     ADD TO CART
  ==================================================== */

  addToCart(
    product: Product
  ): void {

    const productStoreId =
      Number(
        product.productStoreId
      );


    if (
      !product.isAvailable ||
      Number(product.stockQuantity) <= 0
    ) {

      return;

    }


    if (
      this.isProductAdded(
        productStoreId
      )
    ) {

      return;

    }


    this.cartService
      .addToCart(
        productStoreId,
        1
      )
      .subscribe({

        next: response => {

          this.cartCount =
            Number(
              response?.totalItems ?? 0
            );


          const currentProduct =
            this.findProduct(
              productStoreId
            );


          if (currentProduct) {

            currentProduct.alreadyAdded =
              true;

          }

        },

        error: error => {

          console.error(
            'Failed to add product to cart:',
            error
          );

        }

      });

  }


  /* ====================================================
     OPEN PRODUCT
  ==================================================== */

openProduct(
  product: Product
): void {

  if (!product?.productId) {
    return;
  }

  this.router.navigate([
    '/product',
    product.productId
  ]);

}


  /* ====================================================
     CATEGORY
  ==================================================== */
selectCategory(
  categoryId: number
): void {

  if (
    !categoryId ||
    !Number.isInteger(categoryId) ||
    categoryId <= 0
  ) {
    return;
  }

  this.router.navigate(
    ['/categories'],
    {
      queryParams: {
        categoryId
      },
      state: {
        returnTo: 'home'
      }
    }
  );

}


  /* ====================================================
     ADMIN LOGIN
  ==================================================== */

  goToAdminLogin(): void {

    this.router.navigate([
      '/admin-login'
    ]);

  }


  /* ====================================================
     VENDOR
  ==================================================== */
openVendor(
  vendor: StoreVendor
): void {

  this.router.navigate(
    ['/categories'],
    {
      queryParams: {
        storeId: vendor.storeId
      },
      state: {
        returnTo: 'home'
      }
    }
  );

}


  /* ====================================================
     CART
  ==================================================== */

  openCart(): void {

    this.router.navigate([
      '/cart'
    ]);

  }


  /* ====================================================
     ORDERS
  ==================================================== */

  openOrders(): void {

    this.router.navigate([
      '/orders'
    ]);

  }


  goToCategory(categoryId: number): void {
  const categoryElement = document.querySelector(
    `[data-category-id="${categoryId}"]`
  ) as HTMLElement | null;

  if (!categoryElement) return;

  categoryElement.scrollIntoView({
    behavior: 'smooth',
    inline: 'center',
    block: 'nearest'
  });

  this.centeredCategoryId = categoryId;
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



loadCombos(): void {
  this.isCombosLoading = true;
  this.comboErrorMessage = '';

  this.cdr.detectChanges();

  this.productService.getCombos().subscribe({
    next: (response) => {
      this.combos = (Array.isArray(response) ? response : [])
        .map((combo: any): ComboOffer => ({
          comboId: Number(combo.comboId),
          comboName: combo.comboName ?? '',
          description: combo.description ?? '',
          comboImageUrl: combo.comboImageUrl ?? '',
          comboSellingPrice: Number(combo.comboSellingPrice ?? 0),
          totalActualPrice: Number(combo.totalActualPrice ?? 0),
          discountPercentage: Number(combo.discountPercentage ?? 0),

          vendor: {
            vendorId: Number(combo.vendor?.vendorId ?? 0),
            storeName: combo.vendor?.storeName ?? '',
            city: combo.vendor?.city ?? ''
          },

          products: (combo.products ?? []).map((product: any) => ({
            productId: Number(product.productId),
            productStoreId: product.productStoreId != null
              ? Number(product.productStoreId)
              : undefined,
            productName: product.productName ?? '',
            quantity: Number(product.quantity ?? 1),

            // The API returns images[] instead of imageUrl directly.
            imageUrl: product.images?.[0]?.imageUrl ?? ''
          })),

          isAvailable: combo.isAvailable === true
        }));

      this.isCombosLoading = false;
      this.comboErrorMessage = '';

      this.cdr.detectChanges();
    },

    error: (error) => {
      console.error('Combos API Error:', error);

      this.combos = [];
      this.isCombosLoading = false;

      this.comboErrorMessage =
        error?.error?.message ||
        error?.message ||
        'Unable to load combo offers. Please try again.';

      this.cdr.detectChanges();
    }
  });
}
openComboDetails(combo: ComboOffer): void {
  if (!combo?.comboId) {
    return;
  }

  this.stopComboImageTimer();

  this.selectedCombo = combo;
  this.activeComboImageIndex = 0;
  this.showComboDetails = true;

  this.cdr.detectChanges();
  this.startComboImageTimer();
}

closeComboDetails(): void {
  this.stopComboImageTimer();

  this.showComboDetails = false;
  this.selectedCombo = null;
  this.activeComboImageIndex = 0;

  this.cdr.detectChanges();
}

openComboProduct(product: ComboProduct): void {
  const productId = Number(
    product.productStoreId ?? product.productId
  );

  if (!productId) {
    return;
  }

  // Keep the Home page in the navigation stack.
  // Native Back returns to the combo details view.
  void this.router.navigate(['/product', productId]);
}

getComboImageStack(combo: ComboOffer): ComboProduct[] {
  return (combo.products ?? []).slice(0, 3);
}



/* ====================================================
   ADD COMBO TO CART
==================================================== */

addComboToCart(): void {
  const combo = this.selectedCombo;

  if (!combo || !combo.isAvailable) {
    return;
  }

  if (!combo.comboId || combo.comboSellingPrice <= 0) {
    console.error('Invalid combo details.');
    return;
  }

  // TODO: Call the combo-cart API when available.
  // Send comboId and quantity: 1.
  // The backend should preserve the combo selling price.

  console.log('Ready to add combo to cart:', {
    comboId: combo.comboId,
    quantity: 1
  });
}

}