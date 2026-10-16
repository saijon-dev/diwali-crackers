import { Injectable } from '@angular/core';

import {
  HttpClient,
  HttpParams
} from '@angular/common/http';
import {
  Camera,
  CameraDirection,
  CameraResultType,
  CameraSource
} from '@capacitor/camera';
import { Observable, from, of } from 'rxjs';
import { switchMap, map, tap } from 'rxjs/operators';

import { environment } from '../../environments/environment';

import { LocationStateService } from './location-state.service';


/* =========================================================
   PRODUCT IMAGE
========================================================= */

export interface ProductImage {
  productImageId: number;
  imageUrl: string;
}


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


/* =========================================================
   PACK UNIT LOOKUP
========================================================= */

export interface LookupUnit {
  displayName: string;
  lookupCode: string;
  lookupId: number;
  lookupValue: string;
  status: string;
}

export interface VendorCombo {
  comboId: number;
  comboName: string;
  description?: string;
  comboImageUrl?: string;
  comboSellingPrice: number;
  totalActualPrice: number;
  discountAmount: number;
  discountPercentage: number;
  totalProducts: number;
  totalItemQuantity: number;
  isAvailable: boolean;
  createdAt?: string;
  updatedAt?: string;
  products: {
    productId: number;
    productStoreId?: number;
    productName: string;
    quantity: number;
    mrp?: number;
    sellingPrice?: number;
    images?: {
      productImageId?: number;
      imageUrl: string;
    }[];
  }[];
  vendor?: {
    vendorId: number;
    storeName: string;
    city: string;
  };
}


/* =========================================================
   PRODUCT
========================================================= */

export interface Product {
  productId: number;
  productStoreId: number;
    storeId?: number;
  productCode: string;
  productName: string;
  categoryId: number;
  categoryName: string;
  brandName: string;
  description: string;
  isKidsSpecial: boolean;
  size: string;
  packQuantity: number;
  packUnit: string;
  mrp: number;
  sellingPrice: number;
  stockQuantity: number;
  isAvailable: boolean;
  storeName: string;
  storeImageUrl?: string | null;
  storeAddress: string;
  city: string;
  state: string;
  pincode: string;
  contactNumber: string;
  images: ProductImage[];
  badge: string | null;
  alreadyAdded: boolean;
}


/* =========================================================
   PAGINATED PRODUCT RESPONSE
========================================================= */

export interface ProductPageResponse {
  content: Product[];
  empty: boolean;
  first: boolean;
  last: boolean;
  number: number;
  numberOfElements: number;
  size: number;
  totalElements: number;
  totalPages: number;
}


/* =========================================================
   PRODUCT DATA
========================================================= */

export interface ProductData {
  productName: string;
  categoryId: number;
  description: string;
  brandName: string;
  isKidsSpecial: boolean;
  size: string;
  packQuantity: number;
  packUnit: string;
  mrp: number;
  sellingPrice: number;
  stockQuantity: number;
imageIndexes?: number[];
}


/* =========================================================
   CATEGORY
========================================================= */

export interface Category {
  categoryId: number;
  categoryName: string;
  description: string;
  categoryImageUrl?: string;
  status: string;
  createdByType: string;
  createdByUserId: number;
  createdAt: string;
  updatedAt: string;
  alreadyAdded: boolean | null;
}

export interface CategoryData {
  categoryName: string;
  description: string;
}


/* =========================================================
   VENDOR PRODUCT
========================================================= */

/*
 * Vendor products currently have the same product structure.
 *
 * storeImageUrl is optional on Product because customer
 * product responses do not necessarily contain it.
 *
 * This avoids maintaining a second duplicate product interface.
 */
export type VendorProduct = Product;


/* =========================================================
   VENDOR PRODUCT PAGE
========================================================= */

export type VendorProductPage = ProductPageResponse;


/* =========================================================
   ADMIN VENDOR LISTING
========================================================= */

export interface AdminVendorListing {
  productStoreId: number;
  vendorId: number;
  storeName: string;
  brandName: string;
  size: string;
  packQuantity: number;
  packUnit: string;
  mrp: number;
  sellingPrice: number;
  stockQuantity: number;
  isAvailable: boolean;
}


/* =========================================================
   ADMIN PRODUCT
========================================================= */

export interface AdminProduct {
  productId: number;
  productCode: string;
  productName: string;
  categoryId: number;
  categoryName: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdByType: string;
  createdByUserId: number;
  createdByUserName: string;
  createdByStoreName: string;
  vendorListings: AdminVendorListing[];
  images: ProductImage[];
}


/* =========================================================
   ADMIN PRODUCT RESPONSE
========================================================= */

export interface AdminProductResponse {
  products: AdminProduct[];
}


/* =========================================================
   ADMIN PRODUCT LIST ITEM
========================================================= */

export interface AdminProductListItem {
  productId: number;
  productCode: string;
  productName: string;
  categoryId: number;
  categoryName: string;
  status: 'ACTIVE' | 'INACTIVE';
  imageUrl: string;
  alreadyAdded: boolean;
}


/* =========================================================
   ADMIN PRODUCT LIST RESPONSE
========================================================= */

export interface AdminProductListResponse {
  content: AdminProductListItem[];
  empty: boolean;
  first: boolean;
  last: boolean;
  number: number;
  numberOfElements: number;
  size: number;
  totalElements: number;
  totalPages: number;

  pageable?: {
    offset: number;
    pageNumber: number;
    pageSize: number;
    paged: boolean;
    unpaged: boolean;
    sort?: {
      empty: boolean;
      sorted: boolean;
      unsorted: boolean;
    };
  };

  sort?: {
    empty: boolean;
    sorted: boolean;
    unsorted: boolean;
  };
}


/* =========================================================
   PRODUCT SERVICE
========================================================= */

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  private readonly apiUrl = environment.apiUrl;

  /*
   * Development/testing mode.
   *
   * false:
   * - no GPS request
   * - no nearby stores request
   * - /products called directly
   *
   * true:
   * - location is initialized
   * - nearby stores are checked
   * - products are filtered by deliverable stores
   */
  private readonly LOCATION_FILTERING_ENABLED = false;


  /* =======================================================
     CUSTOMER PRODUCT CACHE
  ======================================================= */

  /*
   * Cache is keyed by:
   *
   * page + size
   *
   * Example:
   *
   * "0_12" → first 12 products
   * "1_12" → second 12 products
   */
  private readonly productPageCache =
    new Map<string, ProductPageResponse>();

    private readonly productStoreCategoriesCache =
  new Map<number, Category[]>();


    private readonly productDetailsCache =
  new Map<number, Product>();


  private readonly categoryProductsCache =
  new Map<number, ProductPageResponse>();

private readonly storeProductsCache =
  new Map<string, ProductPageResponse>();

private readonly allVendorProductsCache =
  new Map<number, ProductPageResponse>();

private readonly vendorCategoryProductsCache =
  new Map<string, ProductPageResponse>();

  private adminProductsCache: AdminProductResponse | null = null;


  /*
   * Categories do not change every time the user navigates
   * between customer pages, so keep them in memory.
   */
  private categoriesCache: Category[] | null = null;


  constructor(
    private readonly http: HttpClient,
    private readonly locationStateService: LocationStateService
  ) {}



clearAdminProductCache(): void {
  this.adminProductsCache = null;
}

  
  /* =========================================================
     CUSTOMER PRODUCTS
  ========================================================= */



  getProductDetails(productId: number): Observable<Product> {
  const cached = this.productDetailsCache.get(productId);

  if (cached) {
    return of(cached);
  }

  return this.http
    .get<Product>(`${this.apiUrl}/products/${productId}`)
    .pipe(
      tap(product => {
        this.productDetailsCache.set(productId, product);
      })
    );
}


getCategoryProductsForStore(
  productStoreId: number,
  categoryId: number
): Observable<ProductPageResponse> {
  const cacheKey = `${productStoreId}_${categoryId}`;

  const cached = this.vendorCategoryProductsCache.get(cacheKey);

  if (cached) {
    return of(cached);
  }

  const params = new HttpParams().set(
    'categoryId',
    categoryId
  );

  return this.http
    .get<ProductPageResponse>(
      `${this.apiUrl}/products/${productStoreId}/category-products`,
      { params }
    )
    .pipe(
      tap(response => {
        this.vendorCategoryProductsCache.set(
          cacheKey,
          response
        );
      })
    );
}

  getProducts(
    page: number = 0,
    size: number = 12
  ): Observable<ProductPageResponse> {

    const cacheKey = `${page}_${size}`;

    const cachedResponse =
      this.productPageCache.get(cacheKey);

    /*
     * If this exact page was already loaded,
     * return it without making another HTTP request.
     */
    if (cachedResponse) {
      return of(cachedResponse);
    }


    const params =
      new HttpParams()
        .set('page', page)
        .set('size', size);


    const request$ =
      this.LOCATION_FILTERING_ENABLED
        ? this.getProductsWithLocation(params)
        : this.http.get<ProductPageResponse>(
            `${this.apiUrl}/products`,
            { params }
          );


    return request$.pipe(
      map(response => {

        /*
         * Cache the completed response.
         *
         * Only successful API responses are cached.
         */
        this.productPageCache.set(
          cacheKey,
          response
        );

        return response;

      })
    );

  }



getStoreProducts(
  storeId: number,
  page: number = 0,
  size: number = 10
): Observable<ProductPageResponse> {

  const cacheKey = `${storeId}_${page}_${size}`;

  const cachedResponse =
    this.storeProductsCache.get(cacheKey);

  if (cachedResponse) {
    return of(cachedResponse);
  }

  return this.http
    .get<ProductPageResponse>(
      `${this.apiUrl}/${storeId}/all-vendor-products`,
      {
        params: new HttpParams()
          .set('page', page)
          .set('size', size)
      }
    )
    .pipe(
      map(response => {
        this.storeProductsCache.set(
          cacheKey,
          response
        );

        return response;
      })
    );
}


  /* =========================================================
     CUSTOMER PRODUCTS WITH LOCATION
  ========================================================= */

  private getProductsWithLocation(
    params: HttpParams
  ): Observable<ProductPageResponse> {

    return from(
      this.locationStateService.initializeLocation()
    ).pipe(

      switchMap(() =>
        this.http.get<ProductPageResponse>(
          `${this.apiUrl}/products`,
          { params }
        )
      ),

      map(response => {

        const products =
          this.locationStateService
            .filterProductsByNearbyStores(
              response?.content ?? []
            );


        return {
          ...response,

          content: products,

          numberOfElements:
            products.length,

          empty:
            products.length === 0

        };

      })

    );

  }


  /* =========================================================
     SINGLE PRODUCT
  ========================================================= */

  /*
   * IMPORTANT:
   *
   * This API uses productId.
   *
   * Product Details must use this method instead of
   * loading a paginated /products response and searching
   * through the current Home page.
   */



clearProductDetailsCache(): void {
  this.productDetailsCache.clear();
}


  /* =========================================================
     VENDOR PRODUCTS FOR PRODUCT DETAILS
  ========================================================= */

  getVendorProductsByProductStoreId(
    productStoreId: number
  ): Observable<ProductPageResponse> {

    return this.http.get<ProductPageResponse>(
      `${this.apiUrl}/products/${productStoreId}/vendor-products`
    );

  }


  /* =========================================================
     ALL VENDOR PRODUCTS
  ========================================================= */

getAllVendorProducts(
  productStoreId: number
): Observable<ProductPageResponse> {

  const cachedResponse =
    this.allVendorProductsCache.get(productStoreId);

  if (cachedResponse) {
    return of(cachedResponse);
  }

  return this.http
    .get<ProductPageResponse>(
      `${this.apiUrl}/diwali/stores/product-stores/${productStoreId}/store-products`
    )
    .pipe(
      map(response => {
        this.allVendorProductsCache.set(
          productStoreId,
          response
        );

        return response;
      })
    );
}


  /* =========================================================
     PRODUCTS BY CATEGORY
  ========================================================= */

getProductsByCategory(
  categoryId: number
): Observable<ProductPageResponse> {

  const cachedResponse =
    this.categoryProductsCache.get(categoryId);

  if (cachedResponse) {
    return of(cachedResponse);
  }

  return this.http
    .get<ProductPageResponse>(
      `${this.apiUrl}/products/category/${categoryId}`
    )
    .pipe(
      map(response => {
        this.categoryProductsCache.set(
          categoryId,
          response
        );

        return response;
      })
    );
}


  /* =========================================================
     SEARCH PRODUCTS
  ========================================================= */

  searchProducts(
    search: string,
    page: number = 0,
    size: number = 18
  ): Observable<VendorProductPage> {

    let params =
      new HttpParams()
        .set('page', page)
        .set('size', size);


    const trimmedSearch =
      search.trim();


    if (trimmedSearch) {
      params =
        params.set(
          'search',
          trimmedSearch
        );
    }


    if (!this.LOCATION_FILTERING_ENABLED) {

      return this.http.get<VendorProductPage>(
        `${this.apiUrl}/products`,
        { params }
      );

    }


    return from(
      this.locationStateService.initializeLocation()
    ).pipe(

      switchMap(() =>
        this.http.get<VendorProductPage>(
          `${this.apiUrl}/products`,
          { params }
        )
      ),

      map(response => {

        const products =
          this.locationStateService
            .filterProductsByNearbyStores(
              response?.content ?? []
            );


        return {
          ...response,

          content: products,

          numberOfElements:
            products.length,

          empty:
            products.length === 0

        };

      })

    );

  }


  /* =========================================================
     CATEGORIES
  ========================================================= */

  getCategories(): Observable<Category[]> {

    /*
     * Return cached categories if they have already
     * been loaded during this application session.
     */
    if (this.categoriesCache) {
      return of(this.categoriesCache);
    }


    return this.http.get<Category[]>(
      `${this.apiUrl}/categories`
    ).pipe(

      map(categories => {

        this.categoriesCache =
          categories ?? [];

        return this.categoriesCache;

      })

    );

  }


  /* =========================================================
     CLEAR CUSTOMER CACHE
  ========================================================= */

  /*
   * These are explicit methods.
   *
   * We do NOT call them during normal navigation.
   *
   * They can later be called after an operation that
   * genuinely changes customer product/category data.
   */
  clearProductCache(): void {
    this.productPageCache.clear();
  }


  clearCategoryCache(): void {
    this.categoriesCache = null;
  }

clearCustomerCache(): void {
  this.clearProductCache();
  this.clearCategoryCache();
  this.clearCategoryProductsCache();
  this.clearStoreProductsCache();
  this.clearAllVendorProductsCache();
  this.productDetailsCache.clear();
  this.productStoreCategoriesCache.clear();
  this.vendorCategoryProductsCache.clear();
}


  /* =========================================================
     ADD CATEGORY
  ========================================================= */

  addCategory(
    categoryData: CategoryData,
    image: File
  ): Observable<any> {

    const formData =
      new FormData();


    const categoryBlob =
      new Blob(
        [
          JSON.stringify(categoryData)
        ],
        {
          type: 'application/json'
        }
      );


    formData.append(
      'categoryData',
      categoryBlob
    );


    formData.append(
      'image',
      image,
      image.name
    );


    return this.http.post(
      `${this.apiUrl}/categories`,
      formData
    );

  }


  /* =========================================================
     UPDATE CATEGORY
  ========================================================= */

updateCategory(
  categoryId: number,
  categoryData: {
    categoryName: string;
    description: string;
  },
  image?: File | null
): Observable<any> {
  const formData = new FormData();

  const categoryBlob = new Blob(
    [JSON.stringify(categoryData)],
    { type: 'application/json' }
  );

  formData.append('categoryData', categoryBlob);

  if (image) {
    formData.append('image', image);
  }

  return this.http.put(
    `${this.apiUrl}/categories/${categoryId}`,
    formData
  );
}


  /* =========================================================
     VENDOR PRODUCTS
  ========================================================= */

  getVendorProducts(): Observable<VendorProductPage> {

    return this.http.get<VendorProductPage>(
      `${this.apiUrl}/vendor/products`
    );

  }


  /* =========================================================
     ADD VENDOR PRODUCTS
  ========================================================= */
addProduct(
  products: ProductData[],
  images: File[]
): Observable<any> {

  const formData = new FormData();

  const productsBlob = new Blob(
    [
      JSON.stringify(products)
    ],
    {
      type: 'application/json'
    }
  );

  formData.append(
    'products',
    productsBlob
  );

  images.forEach(image => {

    formData.append(
      'images',
      image,
      image.name
    );

  });

  return this.http.post(
    `${this.apiUrl}/vendor/products/bulk`,
    formData
  );
}


  /* =========================================================
     UPDATE VENDOR PRODUCT
  ========================================================= */
updateVendorProduct(
  productStoreId: number,
  productData: ProductData,
  images: File[]
): Observable<any> {

  const formData = new FormData();

  // Product JSON, including removeImageIds
  const productBlob = new Blob(
    [JSON.stringify(productData)],
    { type: 'application/json' }
  );

  formData.append('productData', productBlob);

  // Existing images to keep


  // Newly added images
  images.forEach(image => {
    formData.append('images', image, image.name);
  });

  return this.http.put(
    `${this.apiUrl}/products/${productStoreId}`,
    formData
  );
}


  /* =========================================================
     ADMIN PRODUCT MASTER LIST
  ========================================================= */

  getAdminProductsV(): Observable<AdminProductListResponse> {

    return this.http.get<AdminProductListResponse>(
      `${this.apiUrl}/vendor/products/master`
    );

  }


  /* =========================================================
     ADMIN PRODUCTS
  ========================================================= */

getAdminProducts(): Observable<AdminProductResponse> {

  /*
   * Return cached admin products if already loaded.
   */
  if (this.adminProductsCache) {

    return of(this.adminProductsCache);

  }


  /*
   * First request:
   * call backend and cache successful response.
   */
  return this.http.get<AdminProductResponse>(
    `${this.apiUrl}/admin/products`
  ).pipe(

    tap(response => {

      this.adminProductsCache =
        response;

    })

  );

}


  /* =========================================================
     ADD ADMIN PRODUCT
  ========================================================= */


addAdminProduct(
  productData: {
    productName: string;
    categoryId: number;
    status: string;
  },
  images: File[]
): Observable<any> {

  const formData = new FormData();

  const productDataBlob = new Blob(
    [JSON.stringify(productData)],
    {
      type: 'application/json'
    }
  );

  formData.append(
    'productData',
    productDataBlob
  );

  // Send multiple images with the same key
  images.forEach((image) => {
    formData.append(
      'images',
      image,
      image.name
    );
  });

  return this.http.post(
    `${this.apiUrl}/admin/products`,
    formData
  ).pipe(
    tap((response) => {
      const result = response as {
        success?: boolean;
      };

      if (result?.success !== false) {
        this.clearAdminProductCache();
      }
    })
  );
}



  /* =========================================================
     UPDATE ADMIN PRODUCT
  ========================================================= */


updateAdminProduct(
  productId: number,
  productData: {
    productName: string;
    categoryId: number;
    status: string;
    removeImageIds: number[];
  },
  images?: File[]
): Observable<any> {

  const formData = new FormData();

  const productDataBlob = new Blob(
    [JSON.stringify(productData)],
    {
      type: 'application/json'
    }
  );

  formData.append('productData', productDataBlob);

  // Send each newly added image using the same key.
  if (images && images.length > 0) {
    images.forEach(image => {
      formData.append('images', image, image.name);
    });
  }

  return this.http.put(
    `${this.apiUrl}/admin/products/${productId}`,
    formData
  ).pipe(
    tap(response => {
      const result = response as {
        success?: boolean;
      };

      if (result?.success !== false) {
        this.clearAdminProductCache();
      }
    })
  );
}




  /* ====================================================
   TAKE PICTURE USING DEVICE CAMERA
==================================================== */
async takePicture(): Promise<File | null> {
  try {
    const photo = await Camera.getPhoto({
      quality: 90,
      resultType: CameraResultType.Uri,
      source: CameraSource.Camera,
      direction: CameraDirection.Rear
    });

    if (!photo.webPath) {
      console.warn('Camera did not return an image path.');
      return null;
    }

    const response = await fetch(photo.webPath);
    const blob = await response.blob();

    const file = new File(
      [blob],
      `camera-${Date.now()}.jpg`,
      {
        type: blob.type || 'image/jpeg'
      }
    );

    return file;

  } catch (error) {
    console.warn('Camera cancelled or unavailable:', error);
    return null;
  }
}



  /* =========================================================
   PACK UNIT LOOKUPS
========================================================= */

getPackUnits(): Observable<LookupUnit[]> {
  return this.http.get<LookupUnit[]>(
    `${this.apiUrl}/diwali/lookups/units`
  );
}


clearCategoryProductsCache(): void {
  this.categoryProductsCache.clear();
  this.vendorCategoryProductsCache.clear();
}

clearStoreProductsCache(): void {
  this.storeProductsCache.clear();
}

clearAllVendorProductsCache(): void {
  this.allVendorProductsCache.clear();
}



getCategoriesByProductStore(
  productStoreId: number
): Observable<Category[]> {

  const cached =
    this.productStoreCategoriesCache.get(productStoreId);

  if (cached) {
    return of(cached);
  }

  return this.http
    .get<Category[]>(
      `${this.apiUrl}/categories/product-stores/${productStoreId}/categories`
    )
    .pipe(
      tap(categories => {
        this.productStoreCategoriesCache.set(
          productStoreId,
          categories
        );
      })
    );

}




addCombo(
  comboDetails: {
    comboName: string;
    description: string;
    comboSellingPrice: number;
    products: {
      productId: number;
      quantity: number;
    }[];
  },
  image?: File | null
): Observable<any> {
  const formData = new FormData();

  const comboBlob = new Blob(
    [JSON.stringify(comboDetails)],
    { type: 'application/json' }
  );

  formData.append('comboDetails', comboBlob);

  if (image) {
    formData.append('image', image, image.name);
  }

  return this.http.post(
    `${this.apiUrl}/diwali/combos`,
    formData
  );
}

getVendorCombos(): Observable<VendorCombo[]> {
  return this.http.get<VendorCombo[]>(
    `${this.apiUrl}/diwali/combos/my`
  );
}


// UPDATE COMBO
updateCombo(
  comboId: number,
  comboDetails: {
    comboName: string;
    description: string;
    comboSellingPrice: number;
    products: {
      productId: number;
      productStoreId: number;
      quantity: number;
    }[];
  },
  image: File | null
): Observable<any> {
  const formData = new FormData();

  formData.append(
    'comboDetails',
    new Blob(
      [JSON.stringify(comboDetails)],
      { type: 'application/json' }
    )
  );

  // Use the same image field name as addCombo().
  if (image) {
    formData.append('image', image);
  }

  return this.http.put<any>(
    `${this.apiUrl}/diwali/combos/${comboId}`,
    formData
  );
}

// CHANGE COMBO STATUS
updateComboStatus(
  comboId: number,
  status: 'ACTIVE' | 'INACTIVE'
): Observable<any> {
  const params = new HttpParams().set('status', status);

  return this.http.put<any>(
    `${this.apiUrl}/diwali/combos/${comboId}/status`,
    null,
    { params }
  );
}


getCombos(): Observable<ComboOffer[]> {
  return this.http.get<ComboOffer[]>(
    `${this.apiUrl}/diwali/combos`
  );
}




}