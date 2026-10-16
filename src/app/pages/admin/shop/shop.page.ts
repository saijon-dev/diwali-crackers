
import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectorRef
} from '@angular/core';

import {
  IonContent,
  IonIcon
} from '@ionic/angular';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { addIcons } from 'ionicons';

import {
  arrowBackOutline,
  storefrontOutline,
  createOutline,
  cameraOutline,
  imagesOutline,
  closeOutline,
  checkmarkOutline
} from 'ionicons/icons';

import {
  Camera,
  CameraResultType,
  CameraSource
} from '@capacitor/camera';

import {
  VendorService,
  StoreProfile,
  UpdateStoreProfileRequest
} from '../../../services/vendor.service';

import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-shop',
  templateUrl: './shop.page.html',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonIcon
  ]
})
export class ShopPage implements OnInit, OnDestroy {

  store: StoreProfile | null = null;

  isLoading = false;
  isEditing = false;
  isSaving = false;
  isChoosingImage = false;

  errorMessage = '';
  successMessage = '';

  selectedImage: File | null = null;
  imagePreviewUrl: string | null = null;

  private originalImagePreviewUrl: string | null = null;

editForm = {
  storeName: '',
  address: '',
  city: '',
  state: '',
  pincode: '',
  deliveryRadiusKm: 0,
  email: '',
  mobileNumber: ''
};

  constructor(
    private vendorService: VendorService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    addIcons({
      arrowBackOutline,
      storefrontOutline,
      createOutline,
      cameraOutline,
      imagesOutline,
      closeOutline,
      checkmarkOutline
    });
  }

  ngOnInit(): void {
    this.loadStoreProfile();
  }

  /* =========================================
     LOAD STORE PROFILE
  ========================================= */

  loadStoreProfile(): void {
    const userId = this.authService.getUserId();

    if (!userId) {
      this.errorMessage =
        'Store information is unavailable. Please open your products first and try again.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.vendorService.getStoreProfile(userId).subscribe({
      next: response => {
        this.store = response;
        this.copyStoreToForm();

        this.isLoading = false;
        this.cdr.detectChanges();
      },

      error: error => {
        console.error('Load Store Profile Error:', error);

        this.store = null;
        this.isLoading = false;

        this.errorMessage =
          error?.error?.message ||
          error?.message ||
          'Unable to load store details. Please try again.';

        this.cdr.detectChanges();
      }
    });
  }

  /* =========================================
     COPY STORE DETAILS INTO EDIT FORM
  ========================================= */

private copyStoreToForm(): void {
  if (!this.store) {
    return;
  }

  this.editForm = {
    storeName: this.store.storeName ?? '',
    address: this.store.address ?? '',
    city: this.store.city ?? '',
    state: this.store.state ?? '',
    pincode: String(this.store.pincode ?? ''),
    deliveryRadiusKm: Number(
      this.store.deliveryRadiusKm ?? 0
    ),
    email: this.store.email ?? '',
    mobileNumber: this.store.mobileNumber ?? ''
  };
}

  /* =========================================
     START EDITING
  ========================================= */

  startEditing(): void {
    if (!this.store || this.isSaving) {
      return;
    }

    this.copyStoreToForm();

    this.errorMessage = '';
    this.successMessage = '';
    this.isEditing = true;
  }

  /* =========================================
     CANCEL EDITING
  ========================================= */

  cancelEditing(): void {
    if (this.isSaving) {
      return;
    }

    this.copyStoreToForm();

    this.isEditing = false;
    this.isChoosingImage = false;
    this.errorMessage = '';
    this.successMessage = '';

    this.selectedImage = null;

    if (this.imagePreviewUrl) {
      URL.revokeObjectURL(this.imagePreviewUrl);
      this.imagePreviewUrl = null;
    }

    this.cdr.detectChanges();
  }

  /* =========================================
     SAVE STORE PROFILE
  ========================================= */

/* =========================================
   SAVE STORE PROFILE
========================================= */

saveStoreProfile(): void {
  if (!this.store || this.isSaving) {
    return;
  }

  const form = this.editForm;

  // Validate required text fields.
  if (
    !form.storeName.trim() ||
    !form.address.trim() ||
    !form.city.trim() ||
    !form.state.trim() ||
    !/^\d{6}$/.test(form.pincode.trim()) ||
    !Number.isFinite(Number(form.deliveryRadiusKm)) ||
    Number(form.deliveryRadiusKm) <= 0
  ) {
    this.errorMessage =
      'Enter valid store details. Pincode must contain 6 digits and delivery radius must be greater than zero.';
    return;
  }

  // Validate email.
  const email = form.email.trim();

  if (
    !email ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    this.errorMessage = 'Enter a valid email address.';
    return;
  }

  // Validate mobile number.
  const mobileNumber = form.mobileNumber.trim();

  if (!/^\d{10}$/.test(mobileNumber)) {
    this.errorMessage =
      'Enter a valid 10-digit mobile number.';
    return;
  }

const userId = this.authService.getUserId();



if (userId === null || !Number.isInteger(userId) || userId <= 0) {
  this.errorMessage = 'Invalid user information. Please log in again.';
  return;
}

  const payload: UpdateStoreProfileRequest = {
    storeName: form.storeName.trim(),
    address: form.address.trim(),
    city: form.city.trim(),
    state: form.state.trim(),
    pincode: form.pincode.trim(),
    deliveryRadiusKm: Number(form.deliveryRadiusKm),
    email,
    mobileNumber
  };

  this.isSaving = true;
  this.errorMessage = '';
  this.successMessage = '';

  this.vendorService.updateStoreProfile(
    userId,
    payload,
    this.selectedImage
  ).subscribe({
    next: response => {
      // Update the profile using the server response.
      this.store = {
        ...this.store!,
        ...response,
        storeImageUrl:
          response?.storeImageUrl ??
          this.store!.storeImageUrl
      };

      // Clear cached data so subsequent requests
      // can retrieve the latest profile.
      this.vendorService.clearStoreProfileCache(userId);

      // Cache the latest response in the service.
      this.vendorService.getStoreProfile(userId).subscribe({
        error: error => {
          console.error(
            'Reload Store Profile Cache Error:',
            error
          );
        }
      });

      this.isEditing = false;
      this.isSaving = false;
      this.isChoosingImage = false;

      this.selectedImage = null;

      if (this.imagePreviewUrl) {
        URL.revokeObjectURL(this.imagePreviewUrl);
        this.imagePreviewUrl = null;
      }

      this.successMessage =
        'Store profile updated successfully.';

      this.copyStoreToForm();
      this.cdr.detectChanges();
    },

    error: error => {
      console.error(
        'Update Store Profile Error:',
        error
      );

      this.isSaving = false;

      this.errorMessage =
        error?.error?.message ||
        error?.message ||
        'Unable to update store details. Please try again.';

      this.cdr.detectChanges();
    }
  });
}

  /* =========================================
     IMAGE PICKER
  ========================================= */

  openImageOptions(): void {
    if (this.isSaving || this.isChoosingImage) {
      return;
    }

    this.errorMessage = '';
    this.isChoosingImage = true;
    this.cdr.detectChanges();
  }

  closeImageOptions(): void {
    this.isChoosingImage = false;
  }

  /* =========================================
     TAKE PHOTO USING CAMERA
  ========================================= */

  async takePhoto(): Promise<void> {
    this.isChoosingImage = false;

    try {
      const photo = await Camera.getPhoto({
        quality: 85,
        width: 1600,
        height: 1600,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera
      });

      if (!photo.webPath) {
        throw new Error('The camera did not return an image.');
      }

      await this.setSelectedImage(photo.webPath);
    } catch (error) {
      console.error('Camera Error:', error);

      this.errorMessage =
        'Unable to take a photo. Check camera permissions and try again.';

      this.cdr.detectChanges();
    }
  }

  /* =========================================
     CHOOSE FROM GALLERY
  ========================================= */

  async chooseFromGallery(): Promise<void> {
    this.isChoosingImage = false;

    try {
      const photo = await Camera.getPhoto({
        quality: 85,
        width: 1600,
        height: 1600,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Photos
      });

      if (!photo.webPath) {
        throw new Error('No image was selected.');
      }

      await this.setSelectedImage(photo.webPath);
    } catch (error) {
      console.error('Gallery Selection Error:', error);

      this.errorMessage =
        'Unable to select the image. Please try again.';

      this.cdr.detectChanges();
    }
  }

  /* =========================================
     CHOOSE FROM FILES
  ========================================= */

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    // Permit selecting the same file again.
    input.value = '';

    if (!file) {
      return;
    }

    if (
      ![
        'image/jpeg',
        'image/png',
        'image/webp'
      ].includes(file.type)
    ) {
      this.errorMessage =
        'Choose a JPG, PNG or WebP image.';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.errorMessage =
        'Choose an image smaller than 5 MB.';
      return;
    }

    this.setImageFile(file);
  }

  /* =========================================
     CONVERT CAMERA IMAGE TO FILE
  ========================================= */

  private async setSelectedImage(
    webPath: string
  ): Promise<void> {
    try {
      const response = await fetch(webPath);

      if (!response.ok) {
        throw new Error('Unable to read the selected image.');
      }

      const blob = await response.blob();

      if (blob.size > 5 * 1024 * 1024) {
        this.errorMessage =
          'Choose an image smaller than 5 MB.';
        this.cdr.detectChanges();
        return;
      }

      const mimeType = blob.type || 'image/jpeg';

      if (
        ![
          'image/jpeg',
          'image/png',
          'image/webp'
        ].includes(mimeType)
      ) {
        this.errorMessage =
          'Choose a JPG, PNG or WebP image.';
        this.cdr.detectChanges();
        return;
      }

      const extension =
        mimeType === 'image/png'
          ? 'png'
          : mimeType === 'image/webp'
            ? 'webp'
            : 'jpg';

      const file = new File(
        [blob],
        `store-image-${Date.now()}.${extension}`,
        { type: mimeType }
      );

      this.setImageFile(file);
    } catch (error) {
      console.error('Image Conversion Error:', error);

      this.errorMessage =
        'Unable to process this image. Please choose another one.';

      this.cdr.detectChanges();
    }
  }

  /* =========================================
     SET IMAGE AND PREVIEW
  ========================================= */

  private setImageFile(file: File): void {
    if (this.imagePreviewUrl) {
      URL.revokeObjectURL(this.imagePreviewUrl);
    }

    this.selectedImage = file;
    this.imagePreviewUrl = URL.createObjectURL(file);

    this.errorMessage = '';
    this.successMessage = '';

    /*
     * Selecting an image also enables Save Changes.
     */
    this.isEditing = true;

    this.cdr.detectChanges();
  }

  /* =========================================
     DISPLAY IMAGE
  ========================================= */

  get displayedStoreImage(): string | null {
    return (
      this.imagePreviewUrl ||
      this.store?.storeImageUrl ||
      null
    );
  }

  /* =========================================
     RETRY
  ========================================= */

  retryLoading(): void {
    this.vendorService.clearStoreProfileCache();
    this.loadStoreProfile();
  }

  /* =========================================
     BACK NAVIGATION
  ========================================= */

  goBack(): void {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      this.router.navigate(['/vend-products']);
    }
  }

  /* =========================================
     CLEAN UP
  ========================================= */

  ngOnDestroy(): void {
    if (this.imagePreviewUrl) {
      URL.revokeObjectURL(this.imagePreviewUrl);
    }

    if (this.originalImagePreviewUrl) {
      URL.revokeObjectURL(this.originalImagePreviewUrl);
    }
  }
}
