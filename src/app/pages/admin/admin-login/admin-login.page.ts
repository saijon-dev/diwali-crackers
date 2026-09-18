import { CommonModule } from '@angular/common';

import { Component } from '@angular/core';

import { BackButtonComponent } from '../../../components/back-button/back-button';

import { AuthService } from '../../../services/auth.service';

import {  ChangeDetectorRef } from '@angular/core';

import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import {
  IonContent,
  IonIcon,
  IonInput,
  IonButton
} from '@ionic/angular';

import {
  callOutline,
  lockClosedOutline
} from 'ionicons/icons';

import { addIcons } from 'ionicons';

import { Router } from '@angular/router';


@Component({
  selector: 'app-admin-login',

  templateUrl: './admin-login.page.html',

  styleUrls: ['./admin-login.page.scss'],

  standalone: true,

  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonContent,
    IonIcon,
    IonInput,
    IonButton,
    BackButtonComponent
  ]
})
export class AdminLoginPage {

errorMessage = '';
  /* =========================================
     LOGIN FORM
     ========================================= */

  loginForm: FormGroup;


  /* =========================================
     OTP STEP
     ========================================= */

  isOtpStep = false;


  /* =========================================
     LOADING
     ========================================= */

  isLoading = false;


  constructor(
    private fb: FormBuilder,

    private router: Router,

    private authService: AuthService,
     private cdr: ChangeDetectorRef
  ) {


    /* =========================================
       ICONS
       ========================================= */

    addIcons({

      callOutline,

      lockClosedOutline

    });


    /* =========================================
       FORM
       ========================================= */

    this.loginForm = this.fb.group({

      mobileNumber: [
        '',
        [
          Validators.required,
          Validators.pattern('^[6-9][0-9]{9}$')
        ]
      ],

      otp: [
        '',
        [
          Validators.pattern('^[0-9]{6}$')
        ]
      ]

    });

  }


  /* =========================================
     FORM CONTROLS
     ========================================= */

  get mobileNumber() {

    return this.loginForm.get('mobileNumber');

  }


  get otp() {

    return this.loginForm.get('otp');

  }


  /* =========================================
     SEND MOBILE NUMBER / VERIFY OTP
     ========================================= */
onLogin(): void {
  this.errorMessage = '';

  if (this.loginForm.invalid) {
    this.loginForm.markAllAsTouched();
    this.cdr.detectChanges();
    return;
  }

  this.isLoading = true;
  this.cdr.detectChanges();

  const mobileNumber = this.mobileNumber?.value;

  // ==============================
  // STEP 1: SEND OTP
  // ==============================
  if (!this.isOtpStep) {

    console.log('Sending OTP for:', mobileNumber);

    this.authService.login({
      mobileNumber: mobileNumber
    }).subscribe({

      next: (response) => {

        console.log('OTP API RESPONSE:', response);

        this.isLoading = false;

        if (response?.success === true) {

          console.log('OTP SENT SUCCESSFULLY');
          console.log('Changing isOtpStep from:', this.isOtpStep);

          this.isOtpStep = true;

          console.log('Changing isOtpStep to:', this.isOtpStep);

          this.otp?.reset();

          this.errorMessage = '';

          // FORCE ANGULAR TO UPDATE THE SCREEN
          this.cdr.detectChanges();

          console.log('Change detection completed');

        } else {

          this.errorMessage =
            response?.message || 'Unable to send OTP';

          this.cdr.detectChanges();
        }
      },

      error: (error) => {

        console.error('OTP API ERROR:', error);

        this.isLoading = false;

        this.errorMessage =
          error?.error?.message ||
          'Unable to send OTP. Please try again.';

        this.cdr.detectChanges();
      }
    });

    return;
  }

  // ==============================
  // STEP 2: VERIFY OTP
  // ==============================

  const otp = this.otp?.value;

  console.log('Verifying OTP:', otp);

  this.isLoading = true;
  this.cdr.detectChanges();

  this.authService.login({
    mobileNumber: mobileNumber,
    otp: otp
  }).subscribe({

  next: (response) => {

  console.log('VERIFY OTP RESPONSE:', response);

  this.isLoading = false;

  if (response?.success === true) {

    console.log('Login successful');

    // AuthService has already stored:
    // accessToken
    // refreshToken
    // role

    const role = this.authService.getRole();

    console.log('Logged-in Role:', role);

    this.cdr.detectChanges();

    // Navigate according to role
    if (role === 'ADMIN') {
      this.router.navigate(['/tabs/products']);
    } else if (role === 'VENDOR') {
      this.router.navigate(['/tabs/products']);
    } else {
      this.router.navigate(['/tabs/home']);
    }

  } else {

    this.errorMessage =
      response?.message || 'Invalid OTP';

    this.cdr.detectChanges();
  }
},

    error: (error) => {

      console.error('VERIFY OTP ERROR:', error);

      this.isLoading = false;

      this.errorMessage =
        error?.error?.message ||
        'OTP verification failed. Please try again.';

      this.cdr.detectChanges();
    }
  });
}


  /* =========================================
     VERIFY OTP
     ========================================= */

  verifyOtp(): void {


    if (
      this.otp?.invalid ||
      !this.otp?.value
    ) {

      this.otp?.markAsTouched();

      return;

    }


    const loginData = {

      mobileNumber:
        this.mobileNumber?.value,

      otp:
        this.otp?.value

    };


    console.log(
      'Verify OTP Request:',
      loginData
    );


    this.isLoading = true;


    this.authService
      .login(loginData)
      .subscribe({

        next: (response) => {

          console.log(
            'Login Success:',
            response
          );


          this.isLoading = false;


          /* ===============================
             SAVE TOKENS
             =============================== */

          if (response?.accessToken) {

            localStorage.setItem(
              'accessToken',
              response.accessToken
            );

          }


          if (response?.refreshToken) {

            localStorage.setItem(
              'refreshToken',
              response.refreshToken
            );

          }


          /* ===============================
             GO TO PRODUCTS
             =============================== */

        const role = this.authService.getRole();

if (role === 'ADMIN') {
  this.router.navigate(['/tabs/adm-vendors']);
} else if (role === 'VENDOR') {
  this.router.navigate(['/tabs/products']);
} else {
  this.router.navigate(['/tabs/home']);
}

        },


        error: (error) => {

          console.error(
            'OTP Verification Failed:',
            error
          );


          this.isLoading = false;

        }

      });

  }


  /* =========================================
     CHANGE MOBILE NUMBER
     ========================================= */

  changeMobileNumber(): void {

    this.isOtpStep = false;

    this.otp?.reset();

  }


  /* =========================================
     BACK TO HOME
     ========================================= */

  goToHome(): void {

    this.router.navigate([
      '/tabs/home'
    ]);

  }

}