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

import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import {
  ActivatedRoute,
  Router
} from '@angular/router';

import {
  HttpClient
} from '@angular/common/http';

import {
  IonContent,
  IonIcon,
  IonRefresher,
  IonRefresherContent
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
    FloatingCartComponent,
    IonRefresher,
    IonRefresherContent
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



get visibleCategories(): ProductCategory[] {
  return this.categories;
}

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
  return this.exploreProducts;
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



  
private categoryProductsCache = new Map<string, Product[]>();
private categoryTotalElementsCache = new Map<string, number>();

private categoryCacheStoreId: number | null = null;
private allCategories: ProductCategory[] = [];

private getCategoryCacheKey(
  storeId: number,
  categoryId: number
): string {
  return `${storeId}_${categoryId}`;
}


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


  private activeRefresher: HTMLIonRefresherElement | null = null;

handleRefresh(event: CustomEvent): void {
  const refresher = event.target as HTMLIonRefresherElement;
  const productStoreId = Number(this.route.snapshot.paramMap.get('id'));

  if (!productStoreId || productStoreId <= 0) {
    void refresher.complete();
    return;
  }

  this.activeRefresher = refresher;

if (this.product) {
this.loadCategories(
  Number(this.product.storeId),
  Number(this.product.productStoreId)
);
}

this.loadVendorProducts(productStoreId);
}

private completeRefresher(): void {
  const refresher = this.activeRefresher;
  this.activeRefresher = null;

  if (refresher) {
    void refresher.complete();
  }
}

  /* =========================================================
     INIT
  ========================================================= */
ngOnInit(): void {
  this.route.paramMap.subscribe(params => {
    const productId = Number(params.get('id'));

    if (!Number.isInteger(productId) || productId <= 0) {
      this.errorMessage = 'Invalid product.';
      this.isLoading = false;
      this.cdr.detectChanges();
      return;
    }

    // Reuse the current product and category caches whenever possible.
    const cachedProduct = this.findCachedProduct(productId);

    if (cachedProduct) {
      this.displayProductFromCache(cachedProduct);
      return;
    }

    // Fetch details only when the product is not already cached.
    this.loadMainProduct(productId);
  });
}



private findCachedProduct(productId: number): Product | undefined {
  // Check the existing vendor product list first.
  const fromVendorProducts = this.allVendorProducts.find(
    item =>
      Number(item.productId) === productId ||
      Number(item.productStoreId) === productId
  );

  if (fromVendorProducts) {
    return fromVendorProducts;
  }

  // Search all cached category product lists.
  for (const products of this.categoryProductsCache.values()) {
    const match = products.find(
      item =>
        Number(item.productId) === productId ||
        Number(item.productStoreId) === productId
    );

    if (match) {
      return match;
    }
  }

  // The currently displayed product may not be in the cache.
  if (
    this.product &&
    (
      Number(this.product.productId) === productId ||
      Number(this.product.productStoreId) === productId
    )
  ) {
    return this.product;
  }

  return undefined;
}

private displayProductFromCache(product: Product): void {
  this.stopImageSlider();

  this.errorMessage = '';
  this.isLoading = false;

  // Do not clear categories, cached products, or the category scroller.
  this.setMainProduct(product);

const storeId = Number(product.storeId);
const categoryId = Number(product.categoryId);

if (
  Number.isInteger(storeId) &&
  storeId > 0 &&
  Number.isInteger(categoryId) &&
  categoryId > 0 &&
  this.categoryProductsCache.has(
    this.getCategoryCacheKey(storeId, categoryId)
  )
) {
  this.selectedCategoryId = categoryId;
  this.displayCachedCategoryProducts(categoryId);
} else if (this.selectedCategoryId !== null) {
  this.displayCachedCategoryProducts(this.selectedCategoryId);
}
}




private loadMainProduct(productId: number): void {
  this.stopImageSlider();

  this.isLoading = true;
 if (this.categories.length === 0) {
  this.isCategoriesLoading = true;
}
  this.errorMessage = '';
  this.product = null;
  this.exploreProducts = [];
  this.allVendorProducts = [];
  this.selectedImageIndex = 0;
  this.quantity = 1;
  this.isAddingToCart = false;
  this.isAddedToCart = false;
  this.selectedCategoryId = null;

  this.cdr.detectChanges();

  this.productService.getProductDetails(productId).subscribe({
    next: product => {
      if (!product) {
        this.isLoading = false;
        this.isCategoriesLoading = false;
        this.errorMessage = 'Unable to find the selected product.';
        this.cdr.detectChanges();
        return;
      }

      this.setMainProduct(product);
      this.isLoading = false;

      // Categories are specific to the product's vendor listing.
const storeId = Number(product.storeId);
const productStoreId = Number(product.productStoreId);

if (storeId > 0 && productStoreId > 0) {
  this.loadCategories(storeId, productStoreId);
}

      // Fetch the selected product's category for this vendor.


      this.cdr.detectChanges();
      this.startImageSlider();
    },
    error: error => {
      console.error('Product Details API Error:', error);

      this.isLoading = false;
      this.isCategoriesLoading = false;
      this.errorMessage =
        error?.error?.message ||
        error?.message ||
        'Unable to load product details.';

      this.cdr.detectChanges();
    }
  });
}


private loadCategoryProducts(
  storeId: number,
  productStoreId: number,
  categoryId: number
): void {
  const cacheKey = this.getCategoryCacheKey(storeId, categoryId);
  const cachedProducts = this.categoryProductsCache.get(cacheKey);

  if (cachedProducts !== undefined) {
    this.exploreProducts = cachedProducts.filter(
      product =>
        Number(product.productStoreId) !== Number(this.product?.productStoreId)
    );

    this.cdr.detectChanges();
    return;
  }

  // Keep the existing API parameter: productStoreId.
  this.productService
    .getCategoryProductsForStore(productStoreId, categoryId)
    .subscribe({
      next: (response: any) => {
        const products: Product[] = Array.isArray(response)
          ? response
          : response?.content ??
            response?.data ??
            response?.products ??
            [];

        this.categoryProductsCache.set(cacheKey, products);

        this.categoryTotalElementsCache.set(
          cacheKey,
          Number(response?.totalElements ?? products.length)
        );

        this.exploreProducts = products.filter(
          product =>
            Number(product.productStoreId) !== Number(this.product?.productStoreId)
        );

        this.cdr.detectChanges();
      },
      error: error => {
        console.error('Failed to load category products:', error);
      }
    });
}

  /* =========================================================
     LOAD CATEGORIES FOR PRODUCT STORE

     Only categories currently used by this vendor's
     products are returned.

     API:
     GET /api/categories/product-stores/{productStoreId}/categories
  ========================================================= */


private loadCategories(
  storeId: number,
  productStoreId: number
): void {
  if (storeId <= 0 || productStoreId <= 0) {
    console.error('Invalid storeId or productStoreId');
    return;
  }

  // Cache is identified by the stable storeId.
  if (
    this.categoryCacheStoreId === storeId &&
    this.allCategories.length > 0
  ) {
    this.finishCategoryLoading();
    return;
  }

  this.isCategoriesLoading = true;
  this.cdr.detectChanges();

  // Preserve the existing API and its productStoreId parameter.
  this.productService
    .getCategoriesByProductStore(productStoreId)
    .subscribe({
      next: (categories: ProductCategory[]) => {
        this.allCategories = (categories ?? []).filter(
          category =>
            Number.isInteger(Number(category.categoryId)) &&
            Number(category.categoryId) > 0
        );

        this.categoryCacheStoreId = storeId;
        this.finishCategoryLoading();
      },
      error: (error: unknown) => {
        console.error('Failed to load categories:', error);
        this.isCategoriesLoading = false;
        this.completeRefresher();
        this.cdr.detectChanges();
      }
    });
}


private finishCategoryLoading(): void {
  const mainCategoryId = Number(this.product?.categoryId);

  // Hide a category only when its sole product is the main product.
  this.categories = this.allCategories.filter(category => {
const storeId = Number(this.product?.storeId);
const cacheKey = this.getCategoryCacheKey(
  storeId,
  category.categoryId
);

const products = this.categoryProductsCache.get(cacheKey);
const totalElements =
  this.categoryTotalElementsCache.get(cacheKey);

   
const containsOnlyMainProduct =
  !!this.product &&
  totalElements === 1 &&
  products?.length === 1 &&
  Number(products[0].productStoreId) ===
    Number(this.product.productStoreId);


    return !containsOnlyMainProduct;
  });

  this.selectedCategoryId = this.categories.some(
    category => category.categoryId === mainCategoryId
  )
    ? mainCategoryId
    : this.categories[0]?.categoryId ?? null;

  this.isCategoriesLoading = false;
  this.completeRefresher();

  if (this.selectedCategoryId !== null) {
    this.displayCachedCategoryProducts(this.selectedCategoryId);
  } else {
    this.exploreProducts = [];
  }

  this.cdr.detectChanges();
}



private displayCachedCategoryProducts(categoryId: number): void {
  const storeId = Number(this.product?.storeId);

  const cacheKey = this.getCategoryCacheKey(
    storeId,
    categoryId
  );

  const cachedProducts =
    this.categoryProductsCache.get(cacheKey) ?? [];

  const mainProductId = Number(this.product?.productStoreId);

  console.log('Category ID:', categoryId);
  console.log('Cached product count:', cachedProducts.length);

  const categoryMatches = cachedProducts.filter(item =>
    Number(item.categoryId) === Number(categoryId)
  );

  console.log('Products matching category:', categoryMatches.length);

  this.exploreProducts = categoryMatches.filter(item =>
    Number(item.productStoreId) !== mainProductId
  );

  console.log('Products displayed:', this.exploreProducts.length);
  console.table(this.exploreProducts);

  this.cdr.detectChanges();
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

            this.completeRefresher();

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

          this.completeRefresher();

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

    if (
  this.selectedCategoryId !== null &&
  !this.visibleCategories.some(
    category => category.categoryId === this.selectedCategoryId
  )
) {
  this.selectedCategoryId =
    this.visibleCategories[0]?.categoryId ?? null;
}

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

selectCategory(categoryId: number): void {
  if (
    !Number.isInteger(Number(categoryId)) ||
    Number(categoryId) <= 0 ||
    !this.categories.some(
      category => Number(category.categoryId) === Number(categoryId)
    )
  ) {
    return;
  }

  this.selectedCategoryId = Number(categoryId);

const storeId = Number(this.product?.storeId);
const productStoreId = Number(this.product?.productStoreId);

if (storeId > 0 && productStoreId > 0) {
  this.loadCategoryProducts(
    storeId,
    productStoreId,
    this.selectedCategoryId
  );
}
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

  this.categoryScrollFrame = requestAnimationFrame(() => {
    this.categoryScrollFrame = null;

    const scroller = this.categoryScroller?.nativeElement;

    if (!scroller || !this.product) {
      return;
    }

    const elements = Array.from(
      scroller.querySelectorAll<HTMLButtonElement>(
        'button[data-category-id]'
      )
    );

    if (elements.length === 0) {
      return;
    }

    const scrollerRect = scroller.getBoundingClientRect();
    const centerX = scrollerRect.left + scrollerRect.width / 2;

    let closestElement: HTMLButtonElement | null = null;
    let closestDistance = Number.POSITIVE_INFINITY;

    for (const element of elements) {
      const rect = element.getBoundingClientRect();
      const elementCenter = rect.left + rect.width / 2;
      const distance = Math.abs(centerX - elementCenter);

      if (distance < closestDistance) {
        closestDistance = distance;
        closestElement = element;
      }
    }

    if (!closestElement) {
      return;
    }

    const categoryId = Number(
      closestElement.dataset['categoryId']
    );

    if (
      !Number.isInteger(categoryId) ||
      categoryId <= 0 ||
      categoryId === this.selectedCategoryId
    ) {
      return;
    }

    this.selectedCategoryId = categoryId;

  this.loadCategoryProducts(
  Number(this.product.storeId),
  Number(this.product.productStoreId),
  categoryId

    );

    this.cdr.detectChanges();
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
  if (!product?.productId || !product?.productStoreId) {
    return;
  }

this.setMainProduct(product);

if (this.categoryCacheStoreId === Number(product.storeId)) {
  this.finishCategoryLoading();
} else {
  this.loadCategories(
  Number(product.storeId),
  Number(product.productStoreId)
);
}
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