import { Component } from '@angular/core';

import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import {
  IonContent,
  IonIcon
} from '@ionic/angular';

import { addIcons } from 'ionicons';

import {
  arrowBackOutline,
  personOutline,
  mailOutline,
  callOutline,
  lockClosedOutline,
  storefrontOutline,
  locationOutline,
  mapOutline,
  homeOutline,
  checkmarkCircleOutline,
  closeOutline,
  eyeOutline,
  eyeOffOutline
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
  styleUrls: ['./adm-add-vendor.page.scss'],

  imports: [
    IonContent,
    IonIcon,
    ReactiveFormsModule
  ]
})
export class AdmAddVendorPage {

  vendorForm: FormGroup;

  isLoading = false;

  errorMessage = '';
  successMessage = '';

  showPassword = false;


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
    private router: Router
  ) {

    addIcons({
      arrowBackOutline,
      personOutline,
      mailOutline,
      callOutline,
      lockClosedOutline,
      storefrontOutline,
      locationOutline,
      mapOutline,
      homeOutline,
      checkmarkCircleOutline,
      closeOutline,
      eyeOutline,
      eyeOffOutline
    });


    // =========================================
    // FORM
    // =========================================

    this.vendorForm = this.fb.group({

      name: [
        '',
        [
          Validators.required,
          Validators.minLength(2)
        ]
      ],

      email: [
        '',
        [
          Validators.required,
          Validators.email
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
          Validators.minLength(2)
        ]
      ],

      address: [
        '',
        [
          Validators.required,
          Validators.minLength(3)
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

      pincode: [
        '',
        [
          Validators.required,
          Validators.pattern('^[0-9]{6}$')
        ]
      ]

    });


    // Default cities for Andhra Pradesh
    this.cities = this.locations['Andhra Pradesh'];


    // =========================================
    // STATE CHANGE
    // =========================================

    this.vendorForm
      .get('state')
      ?.valueChanges
      .subscribe(state => {

        this.cities =
          this.locations[state] || [];

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

  get password() {
    return this.vendorForm.get('password');
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

  get pincode() {
    return this.vendorForm.get('pincode');
  }


  // =========================================
  // BACK
  // =========================================

  goBack(): void {
    this.router.navigate(['/tabs/adm-vendors']);
  }


  // =========================================
  // PASSWORD
  // =========================================

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }


  // =========================================
  // CLEAR FORM
  // =========================================

  clearForm(): void {

    this.vendorForm.reset({

      name: '',
      email: '',
      mobileNumber: '',
      password: '',
      storeName: '',
      address: '',

      // DEFAULT VALUES REMAIN
      state: 'Andhra Pradesh',
      city: 'Visakhapatnam',

      pincode: ''

    });

    this.cities =
      this.locations['Andhra Pradesh'];

    this.errorMessage = '';
    this.successMessage = '';

    this.showPassword = false;
  }


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


    this.isLoading = true;


    const vendorData: AddVendorRequest = {

      name: this.vendorForm.value.name.trim(),

      email: this.vendorForm.value.email.trim(),

      mobileNumber:
        this.vendorForm.value.mobileNumber.trim(),



      storeName:
        this.vendorForm.value.storeName.trim(),

      address:
        this.vendorForm.value.address.trim(),

      city:
        this.vendorForm.value.city,

      state:
        this.vendorForm.value.state,

      pincode:
        this.vendorForm.value.pincode.trim()

    };


    console.log(
      'Add Vendor Request:',
      vendorData
    );


    this.vendorService
      .addVendor(vendorData)
      .subscribe({

        next: (response) => {

          console.log(
            'Add Vendor Response:',
            response
          );

          this.isLoading = false;


          if (response?.success === false) {

            this.errorMessage =
              response.message ||
              'Unable to add vendor.';

            return;
          }


          this.successMessage =
            response?.message ||
            'Vendor added successfully.';


          // Clear vendor details but keep defaults
          this.vendorForm.reset({

            name: '',
            email: '',
            mobileNumber: '',
            password: '',
            storeName: '',
            address: '',

            state: 'Andhra Pradesh',
            city: 'Visakhapatnam',

            pincode: ''

          });

          this.cities =
            this.locations['Andhra Pradesh'];

        },


        error: (error) => {

          console.error(
            'Add Vendor Error:',
            error
          );

          this.isLoading = false;

          this.errorMessage =
            error?.error?.message ||
            'Unable to add vendor. Please try again.';

        }

      });
  }
}