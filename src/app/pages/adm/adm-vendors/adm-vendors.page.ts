import {
  Component,
  OnInit,
  ChangeDetectorRef
} from '@angular/core';

import { FormsModule } from '@angular/forms';

import { Router } from '@angular/router';

import {
  IonContent,
  IonIcon,
  IonBackButton
} from '@ionic/angular';

import { addIcons } from 'ionicons';

import {
  addOutline,
  searchOutline,
  cartOutline,
  homeOutline,
  peopleOutline,
  receiptOutline,
  ellipsisHorizontalOutline,
  chevronForwardOutline,
  locationOutline
} from 'ionicons/icons';

import {
  VendorService,
  AdminVendorResponse
} from '../../../services/vendor.service';


/* =========================================
   FRONTEND VENDOR MODEL
========================================= */

interface Vendor {

  id: number;

  name: string;

  email: string;

  mobileNumber: string;

  storeName: string;

  location: string;

  address: string;

  city: string;

  state: string;

  pincode: string;

  image: string;

  status: 'Active' | 'Inactive';

}


@Component({
  selector: 'app-adm-vendors',

  standalone: true,

  templateUrl: './adm-vendors.page.html',

  styleUrls: ['./adm-vendors.page.scss'],

  imports: [
    IonContent,
    IonIcon,
    FormsModule,
    IonBackButton
  ]
})
export class AdmVendorsPage implements OnInit {


  /* =========================================
     SEARCH / FILTER
  ========================================== */

  searchText = '';

  selectedStatus:
    'ALL' | 'Active' | 'Inactive' = 'ALL';


  /* =========================================
     VENDORS
  ========================================== */

  vendors: Vendor[] = [];


  /* =========================================
     LOADING / ERROR
  ========================================== */

  isLoading = false;

  errorMessage = '';


  constructor(
    private router: Router,

    private vendorService: VendorService,

    private cdr: ChangeDetectorRef
  ) {

    addIcons({

      addOutline,

      searchOutline,

      cartOutline,

      homeOutline,

      peopleOutline,

      receiptOutline,

      ellipsisHorizontalOutline,

      chevronForwardOutline,

      locationOutline

    });

  }


  /* =========================================
     INITIALIZE
  ========================================== */

  ngOnInit(): void {

    this.loadVendors();

  }


  /* =========================================
     GET ALL VENDORS
  ========================================== */

  loadVendors(): void {

    this.isLoading = true;

    this.errorMessage = '';

    this.cdr.detectChanges();


    this.vendorService.getAllVendors().subscribe({

      next: (response: AdminVendorResponse[]) => {

        console.log(
          'Admin Vendors API Response:',
          response
        );


        if (!Array.isArray(response)) {

          this.vendors = [];

          this.errorMessage =
            'Invalid vendor response from server.';

          this.isLoading = false;

          this.cdr.detectChanges();

          return;

        }


        this.vendors =
          response.map(
            vendor => this.mapVendor(vendor)
          );


        console.log(
          'Vendors stored:',
          this.vendors
        );


        this.isLoading = false;

        this.cdr.detectChanges();

      },


      error: (error) => {

        console.error(
          'Admin Vendors API Error:',
          error
        );


        this.vendors = [];

        this.isLoading = false;


        this.errorMessage =
          error?.error?.message ||
          error?.message ||
          'Unable to load vendors. Please try again.';


        this.cdr.detectChanges();

      }

    });

  }


  /* =========================================
     MAP BACKEND RESPONSE
  ========================================== */

  private mapVendor(
    vendor: AdminVendorResponse
  ): Vendor {

    return {

      id: vendor.userId,

      name: vendor.name,

      email: vendor.email,

      mobileNumber: vendor.mobileNumber,

      storeName: vendor.storeName,

      location:
        `${vendor.city}, ${vendor.state}`,

      address: vendor.address,

      city: vendor.city,

      state: vendor.state,

      pincode: vendor.pincode,

      /*
       * Backend currently does not return
       * a vendor image.
       *
       * Keep your existing placeholder until
       * the backend provides one.
       */

      image:
        'assets/images/rectangle-image.png',

      status:
        this.normalizeStatus(vendor.status)

    };

  }


  /* =========================================
     NORMALIZE STATUS
  ========================================== */

  private normalizeStatus(
    status: string
  ): 'Active' | 'Inactive' {

    return status?.toUpperCase() === 'ACTIVE'
      ? 'Active'
      : 'Inactive';

  }


  /* =========================================
     FILTERED VENDORS
  ========================================== */

  get filteredVendors(): Vendor[] {

    const search =
      this.searchText
        .trim()
        .toLowerCase();


    return this.vendors.filter(
      vendor => {

        const matchesSearch =

          !search ||

          vendor.name
            .toLowerCase()
            .includes(search) ||

          vendor.storeName
            .toLowerCase()
            .includes(search) ||

          vendor.city
            .toLowerCase()
            .includes(search) ||

          vendor.state
            .toLowerCase()
            .includes(search) ||

          vendor.mobileNumber
            .includes(search);


        const matchesStatus =

          this.selectedStatus === 'ALL' ||

          vendor.status ===
            this.selectedStatus;


        return (
          matchesSearch &&
          matchesStatus
        );

      }
    );

  }


  /* =========================================
     COUNTS
  ========================================== */

  get allCount(): number {

    return this.vendors.length;

  }


  get activeCount(): number {

    return this.vendors.filter(
      vendor =>
        vendor.status === 'Active'
    ).length;

  }


  get inactiveCount(): number {

    return this.vendors.filter(
      vendor =>
        vendor.status === 'Inactive'
    ).length;

  }


  /* =========================================
     STATUS FILTER
  ========================================== */

  selectStatus(
    status: 'ALL' | 'Active' | 'Inactive'
  ): void {

    this.selectedStatus = status;

    this.cdr.detectChanges();

  }


  /* =========================================
     NAVIGATION
  ========================================== */

  goToHome(): void {

    this.router.navigate([
      '/tabs/adm-home'
    ]);

  }


  goToOrders(): void {

    this.router.navigate([
      '/tabs/adm-orders'
    ]);

  }


  goToProfile(): void {

    this.router.navigate([
      '/tabs/adm-profile'
    ]);

  }


  /* =========================================
     ADD VENDOR
  ========================================== */

  addVendor(): void {

    this.router.navigate([
      '/tabs/adm-add-vendor'
    ]);

  }


  /* =========================================
     OPEN VENDOR
  ========================================== */

openVendor(vendor: Vendor): void {

  console.log(
    'Selected Vendor:',
    vendor
  );

  this.router.navigate([
    '/tabs/adm-edit',
    vendor.id
  ]);

}


  /* =========================================
     MORE MENU
  ========================================== */

  openMoreMenu(
    vendor: Vendor
  ): void {

    console.log(
      'Vendor menu:',
      vendor
    );

  }


  /* =========================================
     RETRY
  ========================================== */

  retryLoadVendors(): void {

    this.loadVendors();

  }

}