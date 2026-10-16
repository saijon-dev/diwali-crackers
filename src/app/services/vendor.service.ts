import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';

import { environment } from '../../environments/environment';


/* =========================================
   ADD VENDOR REQUEST
========================================= */

export interface AddVendorRequest {
  name: string;
  email: string;
  mobileNumber: string;
  storeName: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  deliveryRadiusKm: number;
}

export interface StoreProfile {
  storeId: number;
  storeName: string;
  storeImageUrl: string | null;
  address: string;
  city: string;
  state: string;
  pincode: string;
  deliveryRadiusKm: number;

  email: string;
  mobileNumber: string;
}

export interface UpdateStoreProfileRequest {
  storeName: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  deliveryRadiusKm: number;
  email: string;
  mobileNumber: string;
}

/* =========================================
   ADD / UPDATE VENDOR RESPONSE
========================================= */

export interface AddVendorResponse {
  success?: boolean;
  message?: string;

  userId?: number;
  name?: string;
  email?: string;
  mobileNumber?: string;
  password?: string;

  storeName?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  deliveryRadiusKm?: number;

  latitude?: number | null;
  longitude?: number | null;

  status?: string;

  createdAt?: string;

  diwaliStoreImageKey?: string | null;
  diwaliStoreImageUrl?: string | null;
}


/* =========================================
   UPDATE VENDOR REQUEST
========================================= */

export interface UpdateVendorRequest {
  name: string;
  email: string;
  mobileNumber: string;
  storeName: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  deliveryRadiusKm: number;
}


/* =========================================
   ADMIN VENDOR RESPONSE
========================================= */

export interface AdminVendorResponse {
  userId: number;

  name: string;
  email: string;
  mobileNumber: string;

  storeName: string;
  address: string;
  city: string;
  state: string;
  pincode: string;

  latitude: number | null;
  longitude: number | null;

  deliveryRadiusKm: number | null;

  status: string;

  createdAt: string;

  diwaliStoreImageKey: string | null;
  diwaliStoreImageUrl: string | null;
}


/* =========================================
   STORE / CUSTOMER VENDOR RESPONSE
========================================= */

export interface StoreVendor {
  storeId: number;
  storeName: string;
  storeImageUrl: string | null;

  address: string;
  city: string;
  state: string;
  pincode: string;

  deliveryRadiusKm: number;
}


/* =========================================
   ADMIN VENDOR LIST RESPONSE
========================================= */

export interface VendorListResponse {
  success: boolean;
  message: string;

  vendors: AdminVendorResponse[];

  page: number;
  size: number;

  totalElements: number;
  totalPages: number;

  first: boolean;
  last: boolean;
}


/* =========================================
   STORE PAGE RESPONSE
========================================= */

export interface StorePageResponse {
  content: StoreVendor[];

  empty: boolean;
  first: boolean;
  last: boolean;

  number: number;
  numberOfElements: number;

  size: number;
  totalElements: number;
  totalPages: number;

  pageable: {
    offset: number;
    pageNumber: number;
    pageSize: number;
    paged: boolean;
    unpaged: boolean;

    sort: {
      empty: boolean;
      sorted: boolean;
      unsorted: boolean;
    };
  };

  sort: {
    empty: boolean;
    sorted: boolean;
    unsorted: boolean;
  };
}


/* =========================================
   VENDOR SERVICE
========================================= */

@Injectable({
  providedIn: 'root'
})
export class VendorService {

  private readonly vendorUrl =
    `${environment.apiUrl}/admin/vendors`;

  private readonly storesUrl =
    `${environment.apiUrl}/diwali/stores`;


  /* =========================================
     VENDOR GET API CACHES
  ========================================== */

  /*
   * Cache for:
   * GET /admin/vendors?page=0&size=10
   */
  private allVendorsCache:
    VendorListResponse | null = null;


    private readonly storeProfileCache =
  new Map<number, StoreProfile>();

private readonly currentStoreIdKey =
  'diwali_current_store_id';


  /*
   * Cache for:
   * GET /admin/vendors/active?page=0&size=10
   *
   * Map key:
   * page_size
   */
  private activeVendorsCache =
    new Map<string, VendorListResponse>();


  /*
   * Cache for:
   * GET /admin/vendors/inactive?page=0&size=10
   *
   * Map key:
   * page_size
   */
  private inactiveVendorsCache =
    new Map<string, VendorListResponse>();


  constructor(
    private http: HttpClient
  ) {}


  /* =========================================
     1. ADMIN - CREATE VENDOR

     POST /admin/vendors

     Content-Type:
     multipart/form-data

     Parts:
     vendor
     storeImage - optional
  ========================================== */

  addVendor(
    vendor: AddVendorRequest,
    image: File | null
  ): Observable<AddVendorResponse> {

    const formData = new FormData();

    formData.append(
      'vendor',
      new Blob(
        [JSON.stringify(vendor)],
        { type: 'application/json' }
      ),
      'vendor.json'
    );

    if (image) {

      formData.append(
        'storeImage',
        image,
        image.name
      );

    }

    return this.http.post<AddVendorResponse>(
      this.vendorUrl,
      formData
    ).pipe(

      /*
       * Vendor data changed.
       *
       * Remove old GET data so the next
       * vendor-list request gets fresh data.
       */
      tap(response => {

        if (response?.success !== false) {
          this.clearVendorCache();
        }

      })

    );

  }


  /* =========================================
     2. ADMIN - GET ALL VENDORS

     GET /admin/vendors?page=0&size=10
  ========================================== */

  getAllVendors(
    page: number = 0,
    size: number = 10
  ): Observable<VendorListResponse> {

    /*
     * Cache only the default first page.
     *
     * This matches your current
     * Manage Vendors page.
     */

    if (
      page === 0 &&
      size === 10 &&
      this.allVendorsCache
    ) {

      return of(
        this.allVendorsCache
      );

    }


    const params = new HttpParams()
      .set('page', page)
      .set('size', size);


    return this.http.get<VendorListResponse>(
      this.vendorUrl,
      { params }
    ).pipe(

      tap(response => {

        if (
          page === 0 &&
          size === 10
        ) {

          this.allVendorsCache =
            response;

        }

      })

    );

  }


  /* =========================================
     3. ADMIN - UPDATE VENDOR DETAILS

     PUT /admin/vendors/{userId}

     multipart/form-data

     Parts:
     vendor
     storeImage - optional
  ========================================== */

  updateVendor(
    userId: number,
    vendor: UpdateVendorRequest,
    storeImage?: File | null
  ): Observable<AddVendorResponse> {

    const formData = new FormData();

    const vendorBlob = new Blob(
      [JSON.stringify(vendor)],
      {
        type: 'application/json'
      }
    );

    formData.append(
      'vendor',
      vendorBlob
    );


    if (storeImage) {

      formData.append(
        'storeImage',
        storeImage
      );

    }


    return this.http.put<AddVendorResponse>(
      `${this.vendorUrl}/${userId}`,
      formData
    ).pipe(

      /*
       * Vendor details changed.
       * Remove stale vendor-list cache.
       */
      tap(response => {

        if (response?.success !== false) {
          this.clearVendorCache();
        }

      })

    );

  }


  /* =========================================
     4. ADMIN - ACTIVATE / DEACTIVATE VENDOR

     PUT /admin/vendors/{userId}/status
         ?status=ACTIVE

     or

     ?status=INACTIVE

     Body: None
  ========================================== */

  updateVendorStatus(
    userId: number,
    status: 'ACTIVE' | 'INACTIVE'
  ): Observable<AddVendorResponse> {

    const params = new HttpParams()
      .set('status', status);


    return this.http.put<AddVendorResponse>(
      `${this.vendorUrl}/${userId}/status`,
      null,
      { params }
    ).pipe(

      /*
       * Status changed.
       *
       * This is especially important because
       * the vendor moves between:
       *
       * ALL
       * ACTIVE
       * INACTIVE
       *
       * Therefore all three caches must
       * be invalidated.
       */
      tap(response => {

        if (response?.success !== false) {
          this.clearVendorCache();
        }

      })

    );

  }


  /* =========================================
     5. ADMIN - DELETE VENDOR

     DELETE /admin/vendors/{userId}

     Body: None
  ========================================== */

  deleteVendor(
    userId: number
  ): Observable<AddVendorResponse> {

    return this.http.delete<AddVendorResponse>(
      `${this.vendorUrl}/${userId}`
    ).pipe(

      /*
       * Vendor removed.
       * Clear all vendor GET caches.
       */
      tap(response => {

        if (response?.success !== false) {
          this.clearVendorCache();
        }

      })

    );

  }


  /* =========================================
     6. ADMIN - GET ACTIVE VENDORS

     GET /admin/vendors/active?page=0&size=10
  ========================================== */

  getActiveVendors(
    page: number = 0,
    size: number = 10
  ): Observable<VendorListResponse> {

    const cacheKey =
      `${page}_${size}`;


    /*
     * Return cached response when available.
     *
     * This prevents another HTTP request.
     */
    const cached =
      this.activeVendorsCache.get(
        cacheKey
      );


    if (cached) {

      return of(cached);

    }


    const params = new HttpParams()
      .set('page', page)
      .set('size', size);


    return this.http.get<VendorListResponse>(
      `${this.vendorUrl}/active`,
      { params }
    ).pipe(

      tap(response => {

        this.activeVendorsCache.set(
          cacheKey,
          response
        );

      })

    );

  }


  /* =========================================
     7. ADMIN - GET INACTIVE VENDORS

     GET /admin/vendors/inactive?page=0&size=10
  ========================================== */

  getInactiveVendors(
    page: number = 0,
    size: number = 10
  ): Observable<VendorListResponse> {

    const cacheKey =
      `${page}_${size}`;


    /*
     * Return cached response when available.
     */
    const cached =
      this.inactiveVendorsCache.get(
        cacheKey
      );


    if (cached) {

      return of(cached);

    }


    const params = new HttpParams()
      .set('page', page)
      .set('size', size);


    return this.http.get<VendorListResponse>(
      `${this.vendorUrl}/inactive`,
      { params }
    ).pipe(

      tap(response => {

        this.inactiveVendorsCache.set(
          cacheKey,
          response
        );

      })

    );

  }


  /* =========================================
     8. CLEAR VENDOR CACHE

     Call this whenever vendor data changes.
  ========================================== */

  clearVendorCache(): void {

    /*
     * Clear ALL vendors.
     */
    this.allVendorsCache = null;


    /*
     * Clear ACTIVE vendors.
     */
    this.activeVendorsCache.clear();


    /*
     * Clear INACTIVE vendors.
     */
    this.inactiveVendorsCache.clear();

  }


  /* =========================================
     9. CUSTOMER - GET STORES

     GET /diwali/stores?page=0&size=10
  ========================================== */

  getStores(
    page: number = 0,
    size: number = 10
  ): Observable<StorePageResponse> {

    const params = new HttpParams()
      .set('page', page)
      .set('size', size);


    return this.http.get<StorePageResponse>(
      this.storesUrl,
      { params }
    );

  }


  /**
 * GET /diwali/stores/{storeId}
 *
 * Fetches a store's profile.
 */
getStoreProfile(
  storeId: number
): Observable<StoreProfile> {

  const cachedProfile =
    this.storeProfileCache.get(storeId);

  if (cachedProfile) {
    return of(cachedProfile);
  }

  return this.http.get<StoreProfile>(
    `${this.storesUrl}/${storeId}`
  ).pipe(
    tap(profile => {
      this.storeProfileCache.set(
        storeId,
        profile
      );
    })
  );
}

/**
 * Save the store ID obtained from product data.
 * localStorage keeps it available when navigating
 * between tabs or recreating the page.
 */
setCurrentStoreId(storeId: number): void {

  if (!Number.isInteger(storeId) || storeId <= 0) {
    return;
  }

  localStorage.setItem(
    this.currentStoreIdKey,
    String(storeId)
  );
}

/**
 * Read the current store ID.
 */
getCurrentStoreId(): number | null {

  const storedValue = localStorage.getItem(
    this.currentStoreIdKey
  );

  if (!storedValue) {
    return null;
  }

  const storeId = Number(storedValue);

  return Number.isInteger(storeId) && storeId > 0
    ? storeId
    : null;
}

/**
 * Clear the cached profile after store details change.
 */
clearStoreProfileCache(storeId?: number): void {

  if (storeId !== undefined) {
    this.storeProfileCache.delete(storeId);
    return;
  }

  this.storeProfileCache.clear();
}


/* =========================================
   UPDATE STORE PROFILE

   PUT /diwali/stores/store-profile/{storeId}

   multipart/form-data:
   - storeDetails: application/json
   - image: optional file
========================================= */

updateStoreProfile(
  storeId: number,
  storeDetails: UpdateStoreProfileRequest,
  image?: File | null
): Observable<StoreProfile> {

  const formData = new FormData();

  formData.append(
    'storeDetails',
    new Blob(
      [JSON.stringify(storeDetails)],
      { type: 'application/json' }
    ),
    'storeDetails.json'
  );

  if (image) {
    formData.append(
      'image',
      image,
      image.name
    );
  }

  return this.http.put<StoreProfile>(
    `${this.storesUrl}/store-profile/${storeId}`,
    formData
  ).pipe(
    tap(response => {
      if (response) {
        this.storeProfileCache.set(
          storeId,
          response
        );
      } else {
        this.clearStoreProfileCache(storeId);
      }
    })
  );
}




}