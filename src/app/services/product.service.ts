import { Injectable } from '@angular/core';

import {
  HttpClient,
  HttpParams
} from '@angular/common/http';

import { Observable, from, of } from 'rxjs';

import {
  switchMap,
  map
} from 'rxjs/operators';

import { environment } from '../../environments/environment';

import { LocationStateService } from './location-state.service';


/* =========================================================
   PRODUCT IMAGE
========================================================= */

export interface ProductImage {
  productImageId: number;
  imageUrl: string;
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


/* =========================================================
   PRODUCT
========================================================= */

export interface Product {
  productId: number;
  productStoreId: number;
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
  imageIndexes: number[];
}


/* =========================================================
   CATEGORY
========================================================= */

export interface Category {
  categoryId: number;
  categoryName: string;
  description: string;
  imageUrl?: string;
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
  images: string[];
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


    private readonly productDetailsCache =
  new Map<number, Product>();


  /*
   * Categories do not change every time the user navigates
   * between customer pages, so keep them in memory.
   */
  private categoriesCache: Category[] | null = null;


  constructor(
    private readonly http: HttpClient,
    private readonly locationStateService: LocationStateService
  ) {}





  
  /* =========================================================
     CUSTOMER PRODUCTS
  ========================================================= */

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

  return this.http.get<ProductPageResponse>(
    `${this.apiUrl}/stores/product-stores/${storeId}/store-products?page=${page}&size=${size}`
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
getProduct(
  productId: number
): Observable<Product> {

  const cachedProduct =
    this.productDetailsCache.get(
      productId
    );


  if (cachedProduct) {

    return of(
      cachedProduct
    );

  }


  return this.http
    .get<Product>(
      `${this.apiUrl}/products/${productId}`
    )
    .pipe(

      map(product => {

        this.productDetailsCache.set(
          productId,
          product
        );

        return product;

      })

    );

}


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

    return this.http.get<ProductPageResponse>(
      `${this.apiUrl}/${productStoreId}/all-vendor-products`
    );

  }


  /* =========================================================
     PRODUCTS BY CATEGORY
  ========================================================= */

  getProductsByCategory(
    categoryId: number
  ): Observable<ProductPageResponse> {

    return this.http.get<ProductPageResponse>(
      `${this.apiUrl}/products/category/${categoryId}`
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
    categoryData: CategoryData,
    image: File
  ): Observable<any> {

    const formData =
      new FormData();


    const categoryDataBlob =
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
      categoryDataBlob
    );


    formData.append(
      'image',
      image,
      image.name
    );


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

    const formData =
      new FormData();


    const productsBlob =
      new Blob(
        [
          JSON.stringify({
            products
          })
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
    productId: number,
    productData: any,
    images: File[] = []
  ): Observable<any> {

    const formData =
      new FormData();


    const productDataBlob =
      new Blob(
        [
          JSON.stringify(productData)
        ],
        {
          type: 'application/json'
        }
      );


    formData.append(
      'productData',
      productDataBlob
    );


    images.forEach(image => {

      formData.append(
        'images',
        image,
        image.name
      );

    });


    return this.http.put(
      `${this.apiUrl}/vendor/products/${productId}`,
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

    return this.http.get<AdminProductResponse>(
      `${this.apiUrl}/admin/products`
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
    image: File
  ): Observable<any> {

    const formData =
      new FormData();


    const productDataBlob =
      new Blob(
        [
          JSON.stringify(productData)
        ],
        {
          type: 'application/json'
        }
      );


    formData.append(
      'productData',
      productDataBlob
    );


    formData.append(
      'image',
      image,
      image.name
    );


    return this.http.post(
      `${this.apiUrl}/admin/products`,
      formData
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
    },
    image?: File
  ): Observable<any> {

    const formData =
      new FormData();


    const productDataBlob =
      new Blob(
        [
          JSON.stringify(productData)
        ],
        {
          type: 'application/json'
        }
      );


    formData.append(
      'productData',
      productDataBlob
    );


    if (image) {

      formData.append(
        'image',
        image,
        image.name
      );

    }


    return this.http.put(
      `${this.apiUrl}/admin/products/${productId}`,
      formData
    );

  }



  /* =========================================================
   PACK UNIT LOOKUPS
========================================================= */

getPackUnits(): Observable<LookupUnit[]> {
  return this.http.get<LookupUnit[]>(
    `${this.apiUrl}/lookups/units`
  );
}

}