import {
  Component,
  OnInit,
  ChangeDetectorRef
} from '@angular/core';

import { FormsModule } from '@angular/forms';

import {
  ActivatedRoute,
  Router
} from '@angular/router';

import {
  IonContent,
  IonIcon
} from '@ionic/angular';

import { addIcons } from 'ionicons';

import {
  arrowBackOutline,
  createOutline,
  saveOutline,
  locationOutline,
  callOutline,
  mailOutline,
  storefrontOutline,
  personOutline,
  closeOutline
} from 'ionicons/icons';

import {
  VendorService,
  AdminVendorResponse
} from '../../../services/vendor.service';


/* =========================================
   EDITABLE VENDOR MODEL
========================================= */

interface EditableVendor {

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


@Component({
  selector: 'app-adm-edit',

  standalone: true,

  templateUrl: './adm-edit.page.html',

  styleUrls: ['./adm-edit.page.scss'],

  imports: [
    IonContent,
    IonIcon,
    FormsModule
  ]
})
export class AdmEditPage implements OnInit {


  /* =========================================
     VENDOR ID
  ========================================== */

  vendorId!: number;


  /* =========================================
     VENDOR
  ========================================== */

  vendor: EditableVendor | null = null;


  /* =========================================
     IMAGE
  ========================================== */

  vendorImage =
    'assets/images/rectangle-image.png';


  /* =========================================
     UI STATE
  ========================================== */

  isLoading = true;

  isEditing = false;

  isSaving = false;

  errorMessage = '';


  constructor(
    private route: ActivatedRoute,

    private router: Router,

    private vendorService: VendorService,

    private cdr: ChangeDetectorRef
  ) {

    addIcons({

      arrowBackOutline,

      createOutline,

      saveOutline,

      locationOutline,

      callOutline,

      mailOutline,

      storefrontOutline,

      personOutline,

      closeOutline

    });

  }


  /* =========================================
     INITIALIZE
  ========================================== */

  ngOnInit(): void {

    const id =
      this.route.snapshot.paramMap.get('id');


    if (!id) {

      this.errorMessage =
        'Vendor ID not found.';

      this.isLoading = false;

      this.cdr.detectChanges();

      return;

    }


    this.vendorId = Number(id);

    this.loadVendor();

  }


  /* =========================================
     LOAD VENDOR
  ========================================== */

  loadVendor(): void {

    this.isLoading = true;

    this.errorMessage = '';

    this.cdr.detectChanges();


    /*
     * TEMPORARY APPROACH
     *
     * We are using the existing
     * GET /admin/vendors API and
     * finding the vendor by userId.
     *
     * Later, if backend provides:
     *
     * GET /admin/vendors/{id}
     *
     * we can replace only this method.
     */

    this.vendorService.getAllVendors().subscribe({

      next: (
        response: AdminVendorResponse[]
      ) => {

        console.log(
          'All Vendors Response:',
          response
        );


        const selectedVendor =
          response.find(
            vendor =>
              Number(vendor.userId) ===
              this.vendorId
          );


        if (!selectedVendor) {

          this.vendor = null;

          this.errorMessage =
            'Vendor not found.';

          this.isLoading = false;

          this.cdr.detectChanges();

          return;

        }


        /*
         * Create a separate object.
         *
         * This means we don't directly modify
         * the original API response.
         */

        this.vendor = {

          userId:
            selectedVendor.userId,

          name:
            selectedVendor.name,

          email:
            selectedVendor.email,

          mobileNumber:
            selectedVendor.mobileNumber,

          storeName:
            selectedVendor.storeName,

          address:
            selectedVendor.address,

          city:
            selectedVendor.city,

          state:
            selectedVendor.state,

          pincode:
            selectedVendor.pincode,

          status:
            this.normalizeStatus(
              selectedVendor.status
            )

        };


        this.isLoading = false;

        this.cdr.detectChanges();


        console.log(
          'Selected Vendor:',
          this.vendor
        );

      },


      error: (error) => {

        console.error(
          'Vendor Details API Error:',
          error
        );


        this.vendor = null;

        this.isLoading = false;

        this.errorMessage =
          error?.error?.message ||
          error?.message ||
          'Unable to load vendor details.';


        this.cdr.detectChanges();

      }

    });

  }


  /* =========================================
     NORMALIZE STATUS
  ========================================== */

  private normalizeStatus(
    status: string
  ): string {

    if (
      status?.toUpperCase() ===
      'ACTIVE'
    ) {

      return 'ACTIVE';

    }

    return 'INACTIVE';

  }


  /* =========================================
     EDIT
  ========================================== */

  enableEdit(): void {

    if (!this.vendor) {
      return;
    }

    this.isEditing = true;

    this.cdr.detectChanges();

  }


  /* =========================================
     CANCEL EDIT
  ========================================== */

  cancelEdit(): void {

    /*
     * Reload the original vendor data
     * so unsaved changes are discarded.
     */

    this.isEditing = false;

    this.loadVendor();

  }


  /* =========================================
     UPDATE VENDOR
  ========================================== */

  updateVendor(): void {

    if (!this.vendor) {
      return;
    }


    this.isSaving = true;

    this.cdr.detectChanges();


    /*
     * PUT API WILL BE CONNECTED HERE LATER.
     *
     * For now, simply print the edited
     * vendor object.
     */

    console.log(
      'Vendor ready for PUT API:',
      this.vendor
    );


    /*
     * Temporary saving simulation.
     */

    setTimeout(() => {

      this.isSaving = false;

      this.isEditing = false;

      this.cdr.detectChanges();


      console.log(
        'Vendor update placeholder completed.'
      );

    }, 500);

  }


  /* =========================================
     BACK
  ========================================== */

  goBack(): void {

    this.router.navigate([
      '/tabs/adm-vendors'
    ]);

  }


  /* =========================================
     RETRY
  ========================================== */

  retryLoadVendor(): void {

    this.loadVendor();

  }

}