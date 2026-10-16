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
  IonIcon,
  IonButton,
  ToastController,
  IonRefresher,
  IonRefresherContent
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
  closeOutline,
  navigateOutline,
  cloudUploadOutline,
  alertCircleOutline
} from 'ionicons/icons';

import {
  VendorService,
  AdminVendorResponse,
  VendorListResponse,
  UpdateVendorRequest
} from '../../../services/vendor.service';


@Component({
  selector: 'app-adm-edit',

  standalone: true,

  templateUrl: './adm-edit.page.html',

  imports: [
    IonContent,
    IonIcon,
    IonButton,
    FormsModule,
    IonRefresher,
    IonRefresherContent
  ]
})
export class AdmEditPage implements OnInit {

  vendorId!: number;

  vendor: AdminVendorResponse | null = null;

  isLoading = true;
  isEditing = false;
  isSaving = false;

  errorMessage = '';
  successMessage = '';

  selectedStoreImage: File | null = null;

  storeImagePreview: string | null = null;

  isStoreImageRemoved = false;

  hasChanges = false;

private originalVendorSnapshot = '';

private activeRefresher: HTMLIonRefresherElement | null = null;


  constructor(
    private route: ActivatedRoute,

    private router: Router,

    private vendorService: VendorService,

    private cdr: ChangeDetectorRef,

    private toastController: ToastController
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

      closeOutline,

      navigateOutline,

      cloudUploadOutline,

      alertCircleOutline

    });

  }


  /* =========================================
     INITIALIZE
  ========================================== */




  handleRefresh(event: CustomEvent): void {
  const refresher =
    event.target as HTMLIonRefresherElement;

  // Do not discard unsaved form or image changes.
  if (this.isSaving || this.hasChanges) {
    void refresher.complete();

    void this.showToast(
      this.isSaving
        ? 'Please wait until the update finishes.'
        : 'Save or discard your changes before refreshing.'
    );

    return;
  }

  this.activeRefresher = refresher;
  this.loadVendor();
}

private completeRefresh(): void {
  if (!this.activeRefresher) {
    return;
  }

  const refresher = this.activeRefresher;
  this.activeRefresher = null;

  void refresher.complete();
}

ngOnInit(): void {
  const id = this.route.snapshot.paramMap.get('id');

  if (!id || !Number.isInteger(Number(id)) || Number(id) <= 0) {
    this.errorMessage = 'Vendor ID not found.';
    this.isLoading = false;
    return;
  }

  this.vendorId = Number(id);

  const navigationVendor = history.state?.vendor;

  if (
    navigationVendor &&
    Number(navigationVendor.id) === this.vendorId
  ) {
    this.vendor = {
      userId: this.vendorId,
      name: navigationVendor.name ?? '',
      email: navigationVendor.email ?? '',
      mobileNumber: navigationVendor.mobileNumber ?? '',
      storeName: navigationVendor.storeName ?? '',
      address: navigationVendor.address ?? '',
      city: navigationVendor.city ?? '',
      state: navigationVendor.state ?? '',
      pincode: navigationVendor.pincode ?? '',
      latitude: null,
      longitude: null,
      deliveryRadiusKm: null,
      status: navigationVendor.status === 'Active'
        ? 'ACTIVE'
        : 'INACTIVE',
      createdAt: '',
      diwaliStoreImageKey: null,
      diwaliStoreImageUrl: navigationVendor.image ?? null
    };
  }

  // Always load the complete vendor details.
  this.loadVendor();
}


  /* =========================================
     LOAD VENDOR
  ========================================== */

  loadVendor(): void {

    this.isLoading = true;

    this.errorMessage = '';

    this.clearSelectedImage();


    this.vendorService.getAllVendors().subscribe({

      next: (response: VendorListResponse) => {

        console.log(
          'Vendor List API Response:',
          response
        );


        /*
         * Current API response structure:
         *
         * {
         *   success: true,
         *   message: "...",
         *   vendors: [],
         *   page: 0,
         *   size: 10,
         *   totalElements: 0,
         *   totalPages: 0,
         *   first: true,
         *   last: true
         * }
         *
         * Therefore vendors are inside:
         *
         * response.vendors
         */

        const selectedVendor =
          (response.vendors || []).find(
            item =>
              Number(item.userId) === this.vendorId
          );


        if (!selectedVendor) {

          this.vendor = null;

          this.errorMessage =
            'Vendor not found.';

          this.isLoading = false;

          this.completeRefresh();

          this.cdr.detectChanges();

          this.hasChanges = false;

          return;

        }

this.vendor = {
  userId: selectedVendor.userId,

  name: selectedVendor.name ?? '',
  email: selectedVendor.email ?? '',
  mobileNumber: selectedVendor.mobileNumber ?? '',

  storeName: selectedVendor.storeName ?? '',

  address: selectedVendor.address ?? '',
  city: selectedVendor.city ?? '',
  state: selectedVendor.state ?? '',
  pincode: selectedVendor.pincode ?? '',

  latitude: selectedVendor.latitude ?? null,
  longitude: selectedVendor.longitude ?? null,

  deliveryRadiusKm:
    selectedVendor.deliveryRadiusKm ?? null,

  status:
    this.normalizeStatus(
      selectedVendor.status
    ),

  createdAt:
    selectedVendor.createdAt ?? '',

  diwaliStoreImageKey:
    selectedVendor.diwaliStoreImageKey ?? null,

  diwaliStoreImageUrl:
    selectedVendor.diwaliStoreImageUrl ?? null
};

this.isEditing = true;
this.captureOriginalVendorState();


        this.isLoading = false;

        this.cdr.detectChanges();

      },


      error: (error) => {

        console.error(
          'Vendor Details API Error:',
          error
        );


        this.vendor = null;

        this.isLoading = false;

        this.completeRefresh();


        this.errorMessage =
          error?.error?.message ||
          'Unable to load vendor details. Please try again.';


        this.cdr.detectChanges();

      }

    });

  }


  /* =========================================
     NORMALIZE STATUS
  ========================================== */

  private normalizeStatus(
    status: string | null | undefined
  ): string {

    return status?.toUpperCase() === 'ACTIVE'
      ? 'ACTIVE'
      : 'INACTIVE';

  }


  /* =========================================
     ENABLE EDIT
  ========================================== */

  enableEdit(): void {

    if (
      !this.vendor ||
      this.isSaving
    ) {

      return;

    }


    this.isEditing = true;

    this.errorMessage = '';

    this.successMessage = '';

    this.clearSelectedImage();

  }


  /* =========================================
     CANCEL EDIT
  ========================================== */

  cancelEdit(): void {

    if (this.isSaving) {

      return;

    }


    this.isEditing = false;

    this.errorMessage = '';

    this.successMessage = '';

    this.loadVendor();

  }


  /* =========================================
     STORE IMAGE SELECT
  ========================================== */

  onStoreImageSelected(
    event: Event
  ): void {

    const input =
      event.target as HTMLInputElement;

    const file =
      input.files?.[0];


    if (!file) {

      return;

    }


    const allowedTypes = [

      'image/jpeg',

      'image/png',

      'image/webp'

    ];


    if (
      !allowedTypes.includes(file.type)
    ) {

      this.errorMessage =
        'Please select a JPG, PNG, or WEBP image.';

      input.value = '';

      this.cdr.detectChanges();

      return;

    }


    /* 5 MB maximum */

    if (
      file.size > 5 * 1024 * 1024
    ) {

      this.errorMessage =
        'Please select an image smaller than 5 MB.';

      input.value = '';

      this.cdr.detectChanges();

      return;

    }


    this.clearImagePreview();


    this.selectedStoreImage = file;


    this.storeImagePreview =
      URL.createObjectURL(file);


    this.isStoreImageRemoved = false;


    this.errorMessage = '';

    this.successMessage = '';


    /*
     * Allows the same file to be
     * selected again later.
     */

    input.value = '';


    this.cdr.detectChanges();

    this.refreshHasChanges();

  }


  /* =========================================
     REMOVE STORE IMAGE
  ========================================== */

  removeStoreImage(): void {

    if (
      !this.isEditing ||
      this.isSaving
    ) {

      return;

    }


    this.clearImagePreview();

    this.selectedStoreImage = null;

    this.isStoreImageRemoved = true;


    /*
     * Keep the original URL inside
     * the vendor model.
     *
     * Template hides the image while
     * isStoreImageRemoved is true.
     */

    this.errorMessage = '';

    this.successMessage = '';


    this.cdr.detectChanges();

    this.refreshHasChanges();

  }


  /* =========================================
     CLEAR IMAGE PREVIEW
  ========================================== */

  private clearImagePreview(): void {

    if (this.storeImagePreview) {

      URL.revokeObjectURL(
        this.storeImagePreview
      );

      this.storeImagePreview = null;

    }

  }


  /* =========================================
     CLEAR SELECTED IMAGE
  ========================================== */

  private clearSelectedImage(): void {

    this.clearImagePreview();

    this.selectedStoreImage = null;

    this.isStoreImageRemoved = false;

  }


  /* =========================================
     UPDATE VENDOR
  ========================================== */
updateVendor(): void {

  if (
    !this.vendor ||
    this.isSaving
  ) {
    return;
  }

  const deliveryRadiusKm =
    Number(
      this.vendor.deliveryRadiusKm
    );

  const vendorData: UpdateVendorRequest = {

    name:
      this.vendor.name.trim(),

    email:
      this.vendor.email.trim(),

    mobileNumber:
      this.vendor.mobileNumber.trim(),

    storeName:
      this.vendor.storeName.trim(),

    address:
      this.vendor.address.trim(),

    city:
      this.vendor.city.trim(),

    state:
      this.vendor.state.trim(),

    pincode:
      this.vendor.pincode.trim(),

    deliveryRadiusKm

  };

  // =========================================
  // BASIC VALIDATION
  // =========================================

if (
  !vendorData.name ||
  !vendorData.email ||
  !vendorData.mobileNumber ||
  !vendorData.storeName ||
  !vendorData.address ||
  !vendorData.city ||
  !vendorData.state ||
  !vendorData.pincode
) {
  this.errorMessage = 'Please fill in all vendor details.';
  void this.showToast(this.errorMessage);
  return;
}

  // =========================================
  // DELIVERY RADIUS VALIDATION
  // =========================================

if (
  !Number.isFinite(deliveryRadiusKm) ||
  deliveryRadiusKm <= 0
) {
  this.errorMessage =
    'Please enter a valid delivery radius greater than 0.';
  void this.showToast(this.errorMessage);
  return;
}
  // =========================================
  // EMAIL VALIDATION
  // =========================================
if (
  !/^[^\s@]+@[^\s@]+\.com$/.test(
    vendorData.email
  )
) {
  this.errorMessage =
    'Please enter a valid email address ending with .com.';

      void this.showToast(this.errorMessage);
  return;
}

  // =========================================
  // START SAVING
  // =========================================

  this.isSaving = true;
  this.errorMessage = '';
  this.successMessage = '';

  // =========================================
  // UPDATE API
  // =========================================

this.vendorService.updateVendor(
  this.vendorId,
  vendorData,
  this.selectedStoreImage
).subscribe({

  next: (response) => {
    this.isSaving = false;

    // Handle an unsuccessful response even if HTTP returns 200.
    if (response?.success === false) {
      this.errorMessage =
        response?.message?.toString().trim() ||
        'Unable to update vendor details. Please try again.';

      this.cdr.detectChanges();
      void this.showToast(this.errorMessage);
      return;
    }

    this.isEditing = false;
    this.clearSelectedImage();

    this.successMessage =
      response?.message?.toString().trim() ||
      'Vendor details updated successfully.';

    this.cdr.detectChanges();

    void this.showToast(this.successMessage, true);

    // Navigate only after a successful update.
    this.router.navigate(['/tabs/adm-vendors']);
  },

  error: (error) => {
    console.error('Update Vendor API Error:', error);

    this.isSaving = false;

    const responseBody = error?.error;
    let backendMessage = '';

    if (
      responseBody &&
      typeof responseBody === 'object'
    ) {
      if (
        typeof responseBody.message === 'string' &&
        responseBody.message.trim()
      ) {
        backendMessage = responseBody.message.trim();
      } else if (
        typeof responseBody.error === 'string' &&
        responseBody.error.trim()
      ) {
        backendMessage = responseBody.error.trim();
      } else if (
        typeof responseBody.details === 'string' &&
        responseBody.details.trim()
      ) {
        backendMessage = responseBody.details.trim();
      }
    } else if (
      typeof responseBody === 'string' &&
      responseBody.trim()
    ) {
      backendMessage = responseBody.trim();
    }

    this.errorMessage =
      backendMessage ||
      error?.message ||
      'Unable to update vendor details. Please try again later.';

    this.cdr.detectChanges();

    // Display the actual backend error in the toast.
    void this.showToast(this.errorMessage);
  }

});
}


  /* =========================================
     GO BACK
  ========================================== */

goBack(): void {
  if (this.isSaving) {
    return;
  }

  window.history.back();
}


  /* =========================================
     RETRY
  ========================================== */

  retryLoadVendor(): void {

    this.loadVendor();

  }


  private getVendorSnapshot(): string {
  if (!this.vendor) {
    return '';
  }

  return JSON.stringify({
    name: this.vendor.name,
    email: this.vendor.email,
    mobileNumber: this.vendor.mobileNumber,
    storeName: this.vendor.storeName,
    address: this.vendor.address,
    city: this.vendor.city,
    state: this.vendor.state,
    pincode: this.vendor.pincode,
    deliveryRadiusKm: this.vendor.deliveryRadiusKm
  });
}

private captureOriginalVendorState(): void {
  this.originalVendorSnapshot = this.getVendorSnapshot();
  this.hasChanges = false;
}

onVendorFieldChange(): void {
  this.refreshHasChanges();
}

private refreshHasChanges(): void {
  this.hasChanges =
    this.getVendorSnapshot() !== this.originalVendorSnapshot ||
    this.selectedStoreImage !== null ||
    this.isStoreImageRemoved;
}


  private async showToast(
  message: string,
  isSuccess: boolean = false
): Promise<void> {
  const toast = await this.toastController.create({
    message,
    duration: 3000,
    position: 'bottom',
    cssClass: 'diwali-toast',
    icon: isSuccess
      ? 'checkmark-circle-outline'
      : 'alert-circle-outline'
  });

  await toast.present();
}

}