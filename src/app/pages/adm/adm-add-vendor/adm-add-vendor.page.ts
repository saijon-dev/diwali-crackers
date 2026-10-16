
import { Component, OnDestroy } from '@angular/core';

import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import {
  IonContent,
  IonIcon,
  ToastController
} from '@ionic/angular';

import { addIcons } from 'ionicons';

import {
  arrowBackOutline,
  personOutline,
  mailOutline,
  callOutline,
  storefrontOutline,
  locationOutline,
  mapOutline,
  homeOutline,
  checkmarkCircleOutline,
  closeOutline,
  imageOutline,
  trashOutline,
  alertCircleOutline
} from 'ionicons/icons';

import { Router } from '@angular/router';

import {
  VendorService,
  AddVendorRequest
} from '../../../services/vendor.service';

@Component({
  selector: 'app-adm-add-vendor',
  standalone: true,

  templateUrl: './adm-add-vendor.page.html',
 

  imports: [
    IonContent,
    IonIcon,
    ReactiveFormsModule
  ]
})
export class AdmAddVendorPage implements OnDestroy {

  vendorForm: FormGroup;

  isLoading = false;

  errorMessage = '';
  successMessage = '';

  selectedImage: File | null = null;
  imagePreview: string | null = null;
  imageError = '';

  private imagePreviewUrl: string | null = null;

  readonly maxImageSize = 5 * 1024 * 1024;

  readonly allowedImageTypes = [
    'image/jpeg',
    'image/png',
    'image/webp'
  ];

  // =========================================
  // LOCATION DATA
  // =========================================

  locations: {
    [state: string]: string[];
  } = {
    'Andhra Pradesh': [
      'Visakhapatnam',
      'Vijayawada',
      'Guntur',
      'Tirupati',
      'Vizianagaram'
    ]
  };

  states: string[] = [
    'Andhra Pradesh'
  ];

  cities: string[] = [];

  constructor(
    private fb: FormBuilder,
    private vendorService: VendorService,
    private router: Router,
      private toastController: ToastController
  ) {
    addIcons({
      arrowBackOutline,
      personOutline,
      mailOutline,
      callOutline,
      storefrontOutline,
      locationOutline,
      mapOutline,
      homeOutline,
      checkmarkCircleOutline,
      closeOutline,
      imageOutline,
      trashOutline,
      alertCircleOutline
    });

    this.vendorForm = this.fb.group({
      name: [
        '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.pattern(/^[A-Za-z\s]+$/)
        ]
      ],

  email: [
  '',
  [
    Validators.required,
    Validators.email,
    Validators.pattern(/^[^\s@]+@[^\s@]+\.com$/)
  ]
],
      mobileNumber: [
        '',
        [
          Validators.required,
          Validators.pattern('^[6-9][0-9]{9}$')
        ]
      ],

      storeName: [
        '',
        [
          Validators.required,
          Validators.minLength(2),
                    Validators.pattern(/^[A-Za-z\s]+$/)
        ]
      ],

      address: [
        '',
        [
          Validators.required,
          Validators.minLength(6)
        ]
      ],

      state: [
        'Andhra Pradesh',
        Validators.required
      ],

      city: [
        'Visakhapatnam',
        Validators.required
      ],

      deliveryRadiusKm: [
        10,
        [
          Validators.required,
          Validators.min(1),
          Validators.max(500)
        ]
      ],

      pincode: [
        '',
        [
          Validators.required,
          Validators.pattern('^[0-9]{6}$'),
       
        ]
      ]
    });

    this.cities = this.locations['Andhra Pradesh'];

    // =========================================
    // STATE CHANGE
    // =========================================

    this.vendorForm
      .get('state')
      ?.valueChanges
      .subscribe(state => {
        this.cities = this.locations[state] || [];

        const currentCity =
          this.vendorForm.get('city')?.value;

        if (!this.cities.includes(currentCity)) {
          this.vendorForm
            .get('city')
            ?.setValue(
              this.cities.length > 0
                ? this.cities[0]
                : ''
            );
        }
      });
  }

  // =========================================
  // GETTERS
  // =========================================

  get name() {
    return this.vendorForm.get('name');
  }

  get email() {
    return this.vendorForm.get('email');
  }

  get mobileNumber() {
    return this.vendorForm.get('mobileNumber');
  }

  get storeName() {
    return this.vendorForm.get('storeName');
  }

  get address() {
    return this.vendorForm.get('address');
  }

  get state() {
    return this.vendorForm.get('state');
  }

  get city() {
    return this.vendorForm.get('city');
  }

  get deliveryRadiusKm() {
    return this.vendorForm.get('deliveryRadiusKm');
  }

  get pincode() {
    return this.vendorForm.get('pincode');
  }

  // =========================================
  // BACK
  // =========================================

  goBack(): void {
  
  window.history.back();
  }

  // =========================================
  // IMAGE SELECTION
  // =========================================

onImageSelected(event: Event): void {

  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];

  this.imageError = '';
  this.errorMessage = '';
  this.successMessage = '';

  if (!file) {
    return;
  }


  // =========================================
  // VALIDATE TYPE
  // =========================================

  if (!this.allowedImageTypes.includes(file.type)) {

    this.imageError =
      'Choose a JPG, PNG, or WEBP image.';

    input.value = '';

    return;
  }


  // =========================================
  // VALIDATE SIZE
  // =========================================

  if (file.size > this.maxImageSize) {

    this.imageError =
      'Image size must not exceed 5 MB.';

    input.value = '';

    return;
  }


  // =========================================
  // CLEAR PREVIOUS IMAGE
  // =========================================

  this.clearImagePreview();


  // =========================================
  // STORE FILE
  // =========================================

  this.selectedImage = file;


  // =========================================
  // CREATE INSTANT LOCAL PREVIEW
  // =========================================

  const previewUrl =
    URL.createObjectURL(file);

  this.imagePreview = previewUrl;

  this.imagePreviewUrl = previewUrl;
}

  removeImage(fileInput: HTMLInputElement): void {
    this.selectedImage = null;
    this.imageError = '';
    this.clearImagePreview();
    fileInput.value = '';
  }

  private clearImagePreview(): void {
    if (
      this.imagePreviewUrl &&
      this.imagePreviewUrl.startsWith('blob:')
    ) {
      URL.revokeObjectURL(this.imagePreviewUrl);
    }

    this.imagePreview = null;
    this.imagePreviewUrl = null;
  }

  // =========================================
  // CLEAR FORM
  // =========================================

  clearForm(): void {
    this.vendorForm.reset({
      name: '',
      email: '',
      mobileNumber: '',
      storeName: '',
      address: '',
      state: 'Andhra Pradesh',
      city: 'Visakhapatnam',
      deliveryRadiusKm: 10,
      pincode: ''
    });

    this.cities = this.locations['Andhra Pradesh'];

    this.selectedImage = null;
    this.clearImagePreview();

    this.imageError = '';
    this.errorMessage = '';
    this.successMessage = '';
  }

  // =========================================
  // SUBMIT
  // =========================================

 
// =========================================
// SUBMIT
// =========================================


addVendor(): void {
  this.errorMessage = '';
  this.successMessage = '';

  if (this.vendorForm.invalid) {
    this.vendorForm.markAllAsTouched();
    return;
  }

  if (this.isLoading) {
    return;
  }

  this.isLoading = true;

  const vendorData: AddVendorRequest = {
    name: this.vendorForm.value.name.trim(),
    email: this.vendorForm.value.email.trim(),
    mobileNumber: this.vendorForm.value.mobileNumber.trim(),
    storeName: this.vendorForm.value.storeName.trim(),
    address: this.vendorForm.value.address.trim(),
    city: this.vendorForm.value.city,
    state: this.vendorForm.value.state,
    deliveryRadiusKm: Number(
      this.vendorForm.value.deliveryRadiusKm
    ),
    pincode: this.vendorForm.value.pincode.trim()
  };

  this.vendorService
    .addVendor(vendorData, this.selectedImage)
    .subscribe({

      // =========================================
      // SUCCESS / API RESPONSE
      // =========================================
      next: response => {
        this.isLoading = false;

        console.log('Vendor created:', response);

        const backendMessage =
          response?.message?.toString().trim();

        // Handle an unsuccessful API response.
        if (response?.success === false) {
          this.errorMessage =
            backendMessage ||
            'Unable to add vendor. Please try again later.';

          void this.showToast(this.errorMessage, false);
          return;
        }

        // Save the success message before clearing the form.
        const successMessage =
          backendMessage || 'Vendor added successfully.';

        // Clear all previous vendor details and image.
        this.clearForm();

        this.successMessage = successMessage;

        void this.showToast(this.successMessage, true);

        // Navigate back to the vendor listing.
        setTimeout(() => {
          void this.router.navigate(['/tabs/adm-vendors']);
        }, 3000);
      },

      // =========================================
      // ERROR RESPONSE
      // =========================================
      error: (error: unknown) => {
        this.isLoading = false;

        console.error('Add Vendor Error:', error);

        const apiError = error as {
          status?: number;
          error?: unknown;
          message?: string;
        };

        console.error('Status:', apiError.status);
        console.error('Response body:', apiError.error);
        console.error('Message:', apiError.message);

        // =========================================
        // EXTRACT BACKEND MESSAGE
        // =========================================
        let backendMessage = '';

        // Response body is an object.
        if (
          apiError.error &&
          typeof apiError.error === 'object'
        ) {
          const responseBody = apiError.error as {
            message?: unknown;
            error?: unknown;
            details?: unknown;
          };

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
        }

        // Response body is a string.
        else if (
          typeof apiError.error === 'string' &&
          apiError.error.trim()
        ) {
          backendMessage = apiError.error.trim();
        }

        // Angular error message.
        if (
          !backendMessage &&
          typeof apiError.message === 'string' &&
          apiError.message.trim()
        ) {
          backendMessage = apiError.message.trim();
        }

        // Final error message.
        this.errorMessage =
          backendMessage ||
          'Unable to add vendor. Please try again later.';

        void this.showToast(this.errorMessage, false);
      }
    });
}

  ngOnDestroy(): void {
    this.clearImagePreview();
  }


  private async showToast(
  message: string,
  isSuccess: boolean
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



ionViewWillEnter(): void {
  this.clearForm();
}

}