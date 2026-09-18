import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';

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

@Injectable({
  providedIn: 'root'
})
export class VendorService {

  private readonly vendorUrl =
    `${environment.apiUrl}/admin/vendors`;

  constructor(private http: HttpClient) {}

  addVendor(
    vendor: AddVendorRequest
  ): Observable<AddVendorResponse> {

    return this.http.post<AddVendorResponse>(
      this.vendorUrl,
      vendor
    );
  }
}