import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpParams
} from '@angular/common/http';

import { Observable, from } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';

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
   CUSTOMER PRODUCT
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
   CUSTOMER PRODUCT PAGE RESPONSE
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

export interface VendorProduct {
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
  storeImageUrl: string | null;
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
   VENDOR PRODUCT PAGE
========================================================= */

export interface VendorProductPage {
  content: VendorProduct[];
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
  };

  sort?: {
    empty: boolean;
    sorted: boolean;
    unsorted: boolean;
  };
}


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
   PRODUCT SERVICE
========================================================= */

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  private readonly apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private locationStateService: LocationStateService
  ) {}


  /* =========================================================
     CUSTOMER PRODUCTS

     Location filtering is centralized here.

     Flow:

     GPS Location
          ↓
     Nearby Stores API
          ↓
     Stores where deliversToCustomer = true
          ↓
     Product API
          ↓
     Filter products by storeName
          ↓
     Customer pages receive only allowed products
  ========================================================= */

  getProducts(): Observable<ProductPageResponse> {

    return from(
      this.locationStateService.initializeLocation()
    ).pipe(

      switchMap(() =>
        this.http.get<ProductPageResponse>(
          `${this.apiUrl}/products`
        )
      ),

      map(response => {

        const products =
          this.locationStateService.filterProductsByNearbyStores(
            response?.content || []
          );

        return {
          ...response,

          content: products,

          numberOfElements: products.length,

          empty: products.length === 0
        };
      })
    );
  }


  /* =========================================================
     SEARCH PRODUCTS

     Search also uses the same nearby-store filtering.

     Therefore a customer cannot search and get products
     from a store that does not deliver to their location.
  ========================================================= */

  searchProducts(
    search: string,
    page: number = 0,
    size: number = 10
  ): Observable<VendorProductPage> {

    let params = new HttpParams()
      .set('page', page)
      .set('size', size);

    if (search.trim()) {
      params = params.set(
        'search',
        search.trim()
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
          this.locationStateService.filterProductsByNearbyStores(
            response?.content || []
          );

        return {
          ...response,

          content: products,

          numberOfElements: products.length,

          empty: products.length === 0
        };
      })
    );
  }


  /* =========================================================
     CATEGORIES

     Categories are still returned normally.

     We are NOT filtering categories here because category
     filtering was not part of the nearby-store requirement.
  ========================================================= */

  getCategories(): Observable<Category[]> {

    return this.http.get<Category[]>(
      `${this.apiUrl}/categories`
    );
  }


  /* =========================================================
     ADD CATEGORY
  ========================================================= */

  addCategory(
    categoryData: CategoryData,
    image: File
  ): Observable<any> {

    const formData = new FormData();

    const categoryBlob = new Blob(
      [JSON.stringify(categoryData)],
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

    const formData = new FormData();

    const categoryDataBlob = new Blob(
      [JSON.stringify(categoryData)],
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
     
     IMPORTANT:
     Vendor products are NOT filtered by customer location.

     Vendor should see their own products.
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
        JSON.stringify({
          products: products
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
}