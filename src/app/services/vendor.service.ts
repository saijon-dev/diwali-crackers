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
  pincode: string;
}


/* =========================================
   ADD VENDOR RESPONSE
========================================= */

export interface AddVendorResponse {
  success?: boolean;
  message?: string;

  name?: string;
  email?: string;
  mobileNumber?: string;
  password?: string;
  storeName?: string;
  address?: string;
  city?: string;
  state?: string;
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

  storeName: string;
  address: string;
  city: string;
  state: string;
  pincode: string;

  status: string;
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


  constructor(
    private http: HttpClient
  ) {}


  /* =========================================
     ADD VENDOR
  ========================================== */

  addVendor(
    vendor: AddVendorRequest
  ): Observable<AddVendorResponse> {

    return this.http.post<AddVendorResponse>(
      this.vendorUrl,
      vendor
    );

  }


  /* =========================================
     GET ALL VENDORS
  ========================================== */

  getAllVendors(): Observable<AdminVendorResponse[]> {

    return this.http.get<AdminVendorResponse[]>(
      this.vendorUrl
    );

  }

}