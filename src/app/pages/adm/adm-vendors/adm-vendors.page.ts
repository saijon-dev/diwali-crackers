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
  IonBackButton,
  IonRefresher,
  IonRefresherContent
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
  locationOutline,
  arrowBackOutline
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


/* =========================================
   STATUS TYPE
========================================= */

type VendorStatus =
  'ALL' |
  'Active' |
  'Inactive';


@Component({
  selector: 'app-adm-vendors',

  standalone: true,

  templateUrl: './adm-vendors.page.html',

  imports: [
    IonContent,
    IonIcon,
    FormsModule,
    IonBackButton,
      IonRefresher,
  IonRefresherContent
  ]
})
export class AdmVendorsPage implements OnInit {


  /* =========================================
     SEARCH / FILTER
  ========================================== */

  searchText = '';

  selectedStatus:
    VendorStatus = 'ALL';


  /* =========================================
     VENDORS
  ========================================== */

  vendors: Vendor[] = [];


  /* =========================================
     COUNTS
  ========================================== */

 

  /* =========================================
     LOADING / ERROR
  ========================================== */

  isLoading = false;

  errorMessage = '';


  /* =========================================
     STATUS CONFIRMATION
  ========================================== */

  showStatusConfirmation = false;

  selectedVendorForStatus: Vendor | null = null;

  isChangingStatus = false;

  statusSuccessMessage = '';

  statusErrorMessage = '';

  private activeRefresher: HTMLIonRefresherElement | null = null;


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

      locationOutline,

      arrowBackOutline

    });

  }



  
handleRefresh(event: CustomEvent): void {
  this.activeRefresher =
    event.target as HTMLIonRefresherElement;

  this.loadVendors();
}

private completeRefresh(): void {
  if (!this.activeRefresher) {
    return;
  }

  const refresher = this.activeRefresher;
  this.activeRefresher = null;

  void refresher.complete();
}

  /* =========================================
     INITIALIZE
  ========================================== */

  ngOnInit(): void {

    this.loadVendors();

  }


  ionViewWillEnter(): void {
  this.loadVendors();
}


  /* =========================================
     GET VENDORS
     
     ALL     -> GET /admin/vendors
     ACTIVE  -> GET /admin/vendors/active
     INACTIVE-> GET /admin/vendors/inactive
  ========================================== */

  loadVendors(): void {

    this.isLoading = true;

    this.errorMessage = '';

    this.cdr.detectChanges();


    /*
     * ALL
     */

    if (this.selectedStatus === 'ALL') {

      this.vendorService.getAllVendors().subscribe({

        next: (response) => {

          console.log(
            'Admin Vendors API Response:',
            response
          );


          this.vendors =
            (response.vendors || []).map(
              vendor => this.mapVendor(vendor)
            );


          /*
           * Keep total count from backend
           * when available.
           */

  


          /*
           * Load active/inactive counts
           * separately from their dedicated
           * APIs.
           */

  


          this.isLoading = false;
          this.completeRefresh();

          this.cdr.detectChanges();

        },


        error: (error) => {

          console.error(
            'Admin Vendors API Error:',
            error
          );


          this.vendors = [];

          this.isLoading = false;
              this.completeRefresh();


          this.errorMessage =
            this.getBackendMessage(error) ||
            'Unable to load vendors. Please try again later.';

        


          this.cdr.detectChanges();

        }

      });

      return;
    }


    /*
     * ACTIVE
     */

    if (this.selectedStatus === 'Active') {

      this.vendorService
        .getActiveVendors(0, 10)
        .subscribe({

          next: (response) => {

            console.log(
              'Active Vendors API Response:',
              response
            );


            this.vendors =
              (response.vendors || []).map(
                vendor => this.mapVendor(vendor)
              );




            this.isLoading = false;
            this.completeRefresh();

            this.cdr.detectChanges();

          },


          error: (error) => {

            console.error(
              'Active Vendors API Error:',
              error
            );


            this.vendors = [];

            this.isLoading = false;
            this.completeRefresh();


            this.errorMessage =
              this.getBackendMessage(error) ||
              'Unable to load active vendors. Please try again later.';



            this.cdr.detectChanges();

          }

        });

      return;
    }


    /*
     * INACTIVE
     */

    this.vendorService
      .getInactiveVendors(0, 10)
      .subscribe({

        next: (response) => {

          console.log(
            'Inactive Vendors API Response:',
            response
          );


          this.vendors =
            (response.vendors || []).map(
              vendor => this.mapVendor(vendor)
            );




          this.isLoading = false;
              this.completeRefresh();

          this.cdr.detectChanges();

        },


        error: (error) => {

          console.error(
            'Inactive Vendors API Error:',
            error
          );


          this.vendors = [];

          this.isLoading = false;

              this.completeRefresh();


          this.errorMessage =
            this.getBackendMessage(error) ||
            'Unable to load inactive vendors. Please try again later.';


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

      image:
        vendor.diwaliStoreImageUrl ||
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
  const search = this.searchText.trim().toLowerCase();

  return this.vendors.filter((vendor) => {
    const matchesSearch =
      !search ||
      (vendor.name ?? '').toLowerCase().includes(search) ||
      (vendor.storeName ?? '').toLowerCase().includes(search) ||
      (vendor.city ?? '').toLowerCase().includes(search) ||
      (vendor.state ?? '').toLowerCase().includes(search) ||
      (vendor.mobileNumber ?? '').includes(search);

    return matchesSearch;
  });
}





  /* =========================================
     STATUS FILTER
  ========================================== */
selectStatus(
  status: 'ALL' | 'Active' | 'Inactive'
): void {

  if (this.selectedStatus === status) {
    return;
  }

  /*
   * Change the selected button immediately.
   */
  this.selectedStatus = status;

  /*
   * Tell Angular to update the button.
   */
  this.cdr.detectChanges();

  /*
   * Let the browser paint the selected button
   * before loading the vendor data.
   *
   * Since the GET APIs are cached, this does
   * not introduce any meaningful delay.
   */
  setTimeout(() => {
    this.loadVendors();
  }, 0);

}


  /* =========================================
     STATUS CONFIRMATION
  ========================================== */

  confirmChangeStatus(
    vendor: Vendor
  ): void {

    /*
     * Store selected vendor.
     */

    this.selectedVendorForStatus = vendor;


    /*
     * Clear previous messages.
     */

    this.statusSuccessMessage = '';

    this.statusErrorMessage = '';

    this.isChangingStatus = false;


    /*
     * Open custom confirmation modal.
     */

    this.showStatusConfirmation = true;

    this.cdr.detectChanges();

  }


  /* =========================================
     CANCEL STATUS CHANGE
  ========================================== */

  cancelStatusChange(): void {

    /*
     * Don't close while API request
     * is running.
     */

    if (this.isChangingStatus) {
      return;
    }


    this.showStatusConfirmation = false;

    this.selectedVendorForStatus = null;

    this.statusSuccessMessage = '';

    this.statusErrorMessage = '';

    this.cdr.detectChanges();

  }


  /* =========================================
     CONFIRM STATUS CHANGE
  ========================================== */

  confirmStatusChange(): void {

    const vendor =
      this.selectedVendorForStatus;


    if (!vendor) {
      return;
    }


    /*
     * Determine new backend status.
     */

    const newStatus:
      'ACTIVE' | 'INACTIVE' =
        vendor.status === 'Active'
          ? 'INACTIVE'
          : 'ACTIVE';


    this.isChangingStatus = true;

    this.statusSuccessMessage = '';

    this.statusErrorMessage = '';

    this.cdr.detectChanges();


    /*
     * Existing PUT API:
     *
     * PUT /admin/vendors/{userId}/status
     * ?status=ACTIVE / INACTIVE
     */

    this.vendorService
      .updateVendorStatus(
        vendor.id,
        newStatus
      )
      .subscribe({

        next: (response) => {

          console.log(
            'Vendor Status Update Response:',
            response
          );


          const backendMessage =
            response?.message
              ?.toString()
              .trim();


          /*
           * Backend explicitly says failure.
           */

          if (response?.success === false) {

            this.isChangingStatus = false;

            this.statusErrorMessage =
              backendMessage ||
              'Unable to update vendor status. Please try again later.';

            this.cdr.detectChanges();

            return;

          }


          /*
           * Success.
           */

          this.statusSuccessMessage =
            backendMessage ||
            (
              newStatus === 'INACTIVE'
                ? 'Vendor made inactive successfully.'
                : 'Vendor made active successfully.'
            );


          this.cdr.detectChanges();


          /*
           * Refresh the list from backend.
           *
           * This is important because the status
           * button should reflect the actual
           * backend state.
           */

          setTimeout(() => {

            this.showStatusConfirmation = false;

            this.selectedVendorForStatus = null;

            this.statusSuccessMessage = '';

            this.isChangingStatus = false;

            this.loadVendors();

          }, 700);

        },


        error: (error) => {

          console.error(
            'Vendor Status Update Error:',
            error
          );


          this.isChangingStatus = false;


          this.statusErrorMessage =
            this.getBackendMessage(error) ||
            'Unable to update vendor status. Please try again later.';


          this.cdr.detectChanges();

        }

      });

  }


  /* =========================================
     BACKEND ERROR MESSAGE
  ========================================== */

  private getBackendMessage(
    error: unknown
  ): string {

    const apiError =
      error as {
        status?: number;
        error?: unknown;
        message?: string;
      };


    /*
     * JSON response body
     */

    if (
      apiError.error &&
      typeof apiError.error === 'object'
    ) {

      const responseBody =
        apiError.error as {
          message?: unknown;
          error?: unknown;
          details?: unknown;
        };


      if (
        typeof responseBody.message === 'string' &&
        responseBody.message.trim()
      ) {

        return responseBody.message.trim();

      }


      if (
        typeof responseBody.error === 'string' &&
        responseBody.error.trim()
      ) {

        return responseBody.error.trim();

      }


      if (
        typeof responseBody.details === 'string' &&
        responseBody.details.trim()
      ) {

        return responseBody.details.trim();

      }

    }


    /*
     * Plain string response body
     */

    if (
      typeof apiError.error === 'string' &&
      apiError.error.trim()
    ) {

      return apiError.error.trim();

    }


    /*
     * Angular error message
     */

    if (
      typeof apiError.message === 'string' &&
      apiError.message.trim()
    ) {

      return apiError.message.trim();

    }


    return '';

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
  if (vendor.status !== 'Active') {
    return;
  }

  this.router.navigate(
    ['/tabs/adm-edit', vendor.id],
    {
      state: {
        vendor: { ...vendor }
      }
    }
  );
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


  /* =========================================
     BACK
  ========================================== */

  goBack(): void {

    window.history.back();

  }

  onVendorImageError(event: Event): void {
  const img = event.target as HTMLImageElement;
  img.onerror = null;
  img.style.display = 'none';
}

}