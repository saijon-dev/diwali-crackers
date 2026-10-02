
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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
  deliveryRadiusKm: number;
  pincode: string;
}

/* =========================================
   ADD VENDOR RESPONSE
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
  deliveryRadiusKm?: number;
  pincode?: string;
}

/* =========================================
   ADMIN VENDOR RESPONSE
========================================= */

export interface AdminVendorResponse {
  userId: number;
  name: string;
  email: string;
  mobileNumber: string;
 storeImageUrl: string | null;
  storeName: string;
  address: string;
  city: string;
  state: string;
 deliveryRadiusKm?: number | null;
  pincode: string;
  status: string;
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
    `${environment.apiUrl}/stores`;

  constructor(
    private http: HttpClient
  ) {}

  /* =========================================
     ADD VENDOR WITH STORE IMAGE
     MULTIPART FORM DATA
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
  );
}



  updateVendor(
    userId: number,
    vendor: AdminVendorResponse,
    image?: File | null
  ): Observable<unknown> {
    const formData = new FormData();

    formData.append(
      'vendor',
      new Blob(
        [JSON.stringify(vendor)],
        { type: 'application/json' }
      )
    );

    if (image) {
      formData.append(
        'storeImage',
        image,
        image.name
      );
    }

    return this.http.put(
      `${environment.apiUrl}/admin/vendors/${userId}`,
      formData
    );
  }

  /* =========================================
     GET ALL ADMIN VENDORS
  ========================================== */

  getAllVendors(): Observable<AdminVendorResponse[]> {

    return this.http.get<AdminVendorResponse[]>(
      this.vendorUrl
    );
  }

  /* =========================================
     GET STORES FOR CUSTOMER HOME
  ========================================== */

  getStores(
    page: number = 0,
    size: number = 10
  ): Observable<StorePageResponse> {

    return this.http.get<StorePageResponse>(
      `${this.storesUrl}?page=${page}&size=${size}`
    );
  }
}