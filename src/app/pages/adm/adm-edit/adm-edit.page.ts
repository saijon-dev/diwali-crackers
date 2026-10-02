
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import {
  IonContent,
  IonIcon,
  IonButton
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
  cloudUploadOutline
} from 'ionicons/icons';

import {
  VendorService,
  AdminVendorResponse
} from '../../../services/vendor.service';

@Component({
  selector: 'app-adm-edit',
  standalone: true,
  templateUrl: './adm-edit.page.html',
  imports: [
    IonContent,
    IonIcon,
    IonButton,
    FormsModule
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
      closeOutline,
      navigateOutline,
      cloudUploadOutline
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (!id || !Number.isInteger(Number(id)) || Number(id) <= 0) {
      this.errorMessage = 'Vendor ID not found.';
      this.isLoading = false;
      return;
    }

    this.vendorId = Number(id);
    this.loadVendor();
  }

  loadVendor(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.clearSelectedImage();

    this.vendorService.getAllVendors().subscribe({
      next: (response: AdminVendorResponse[]) => {
        const selectedVendor = response.find(
          item => Number(item.userId) === this.vendorId
        );

        if (!selectedVendor) {
          this.vendor = null;
          this.errorMessage = 'Vendor not found.';
          this.isLoading = false;
          this.cdr.detectChanges();
          return;
        }

        this.vendor = {
          userId: selectedVendor.userId,
          name: selectedVendor.name ?? '',
          email: selectedVendor.email ?? '',
          mobileNumber: selectedVendor.mobileNumber ?? '',
          storeName: selectedVendor.storeName ?? '',
          storeImageUrl: selectedVendor.storeImageUrl ?? null,
          address: selectedVendor.address ?? '',
          city: selectedVendor.city ?? '',
          state: selectedVendor.state ?? '',
          pincode: selectedVendor.pincode ?? '',
          status: this.normalizeStatus(selectedVendor.status),
          deliveryRadiusKm: selectedVendor.deliveryRadiusKm ?? null
        };

        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Vendor Details API Error:', error);

        this.vendor = null;
        this.isLoading = false;
        this.errorMessage =
          error?.error?.message ||
          'Unable to load vendor details. Please try again.';

        this.cdr.detectChanges();
      }
    });
  }

  private normalizeStatus(
    status: string | null | undefined
  ): string {
    return status?.toUpperCase() === 'ACTIVE'
      ? 'ACTIVE'
      : 'INACTIVE';
  }

  enableEdit(): void {
    if (!this.vendor || this.isSaving) {
      return;
    }

    this.isEditing = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.clearSelectedImage();
  }

  cancelEdit(): void {
    if (this.isSaving) {
      return;
    }

    this.isEditing = false;
    this.errorMessage = '';
    this.successMessage = '';
    this.loadVendor();
  }

  onStoreImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp'
    ];

    if (!allowedTypes.includes(file.type)) {
      this.errorMessage =
        'Please select a JPG, PNG, or WEBP image.';
      input.value = '';
      this.cdr.detectChanges();
      return;
    }

    // Optional safety limit: 5 MB.
    if (file.size > 5 * 1024 * 1024) {
      this.errorMessage =
        'Please select an image smaller than 5 MB.';
      input.value = '';
      this.cdr.detectChanges();
      return;
    }

    this.clearImagePreview();

    this.selectedStoreImage = file;
    this.storeImagePreview = URL.createObjectURL(file);
    this.isStoreImageRemoved = false;

    this.errorMessage = '';
    this.successMessage = '';

    // Allows the same file to be selected again later.
    input.value = '';

    this.cdr.detectChanges();
  }

  removeStoreImage(): void {
    if (!this.isEditing || this.isSaving) {
      return;
    }

    this.clearImagePreview();
    this.selectedStoreImage = null;
    this.isStoreImageRemoved = true;

    // Keep the original URL in the vendor model.
    // The template hides it while isStoreImageRemoved is true.
    // The update payload sends null when removal is requested.

    this.errorMessage = '';
    this.successMessage = '';

    this.cdr.detectChanges();
  }

  private clearImagePreview(): void {
    if (this.storeImagePreview) {
      URL.revokeObjectURL(this.storeImagePreview);
      this.storeImagePreview = null;
    }
  }

  private clearSelectedImage(): void {
    this.clearImagePreview();
    this.selectedStoreImage = null;
    this.isStoreImageRemoved = false;
  }

  updateVendor(): void {
    if (!this.vendor || this.isSaving) {
      return;
    }

    const deliveryRadiusKm = Number(
      this.vendor.deliveryRadiusKm
    );

    const vendorData: AdminVendorResponse = {
      userId: this.vendor.userId,
      name: this.vendor.name.trim(),
      email: this.vendor.email.trim(),
      mobileNumber: this.vendor.mobileNumber.trim(),
      storeName: this.vendor.storeName.trim(),

      storeImageUrl: this.isStoreImageRemoved
        ? null
        : this.vendor.storeImageUrl ?? null,

      address: this.vendor.address.trim(),
      city: this.vendor.city.trim(),
      state: this.vendor.state.trim(),
      pincode: this.vendor.pincode.trim(),
      status: this.normalizeStatus(this.vendor.status),
      deliveryRadiusKm
    };

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
      return;
    }

    if (
      !Number.isFinite(deliveryRadiusKm) ||
      deliveryRadiusKm <= 0
    ) {
      this.errorMessage =
        'Please enter a valid delivery radius greater than 0.';
      return;
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(vendorData.email)
    ) {
      this.errorMessage = 'Please enter a valid email address.';
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';

    // Uses your existing multipart service method.
    // The selected image is sent with the vendor details.
    this.vendorService.updateVendor(
      this.vendorId,
      vendorData,
      this.selectedStoreImage
    ).subscribe({
      next: () => {
        this.isSaving = false;
        this.isEditing = false;
        this.successMessage =
          'Vendor details updated successfully.';

        this.clearSelectedImage();
        this.loadVendor();
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Update Vendor API Error:', error);

        this.isSaving = false;
        this.errorMessage =
          error?.error?.message ||
          'Unable to update vendor details. Please try again.';

        this.cdr.detectChanges();
      }
    });
  }

  goBack(): void {
    if (this.isSaving) {
      return;
    }

    this.router.navigate(['/tabs/adm-vendors']);
  }

  retryLoadVendor(): void {
    this.loadVendor();
  }
}