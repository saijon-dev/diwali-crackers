import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component } from '@angular/core';

import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import { Router } from '@angular/router';

import {
  IonBackButton,
  IonButton,
  IonContent,
  IonIcon,
  IonInput
} from '@ionic/angular';

import {
  arrowBackOutline,
  callOutline,
  lockClosedOutline
} from 'ionicons/icons';

import { addIcons } from 'ionicons';

import { BackButtonComponent } from '../../components/back-button/back-button';
import { AuthService } from '../../services/auth.service';


@Component({
  selector: 'app-vendor-login',

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
    IonBackButton,
    BackButtonComponent
  ]
})
export class AdminLoginPage {

  /* =========================================
     LOGIN STATE
  ========================================= */

  errorMessage = '';

  isOtpStep = false;

  isLoading = false;


  /* =========================================
     LOGIN FORM
  ========================================= */

  loginForm: FormGroup;


  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {

    addIcons({
      callOutline,
      lockClosedOutline,
      arrowBackOutline
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
     FORM GETTERS
  ========================================= */

  get mobileNumber() {
    return this.loginForm.get('mobileNumber');
  }


  get otp() {
    return this.loginForm.get('otp');
  }


  /* =========================================
     ROLE BASED REDIRECTION
  ========================================= */

  private redirectByRole(): void {

    const role =
      this.authService.getRole();


    /* =========================================
       ADMIN
    ========================================= */

    if (role === 'ADMIN') {

      this.router.navigate([
        '/tabs/adm-vendors'
      ]);

      return;
    }


    /* =========================================
       VENDOR
    ========================================= */

    if (role === 'VENDOR') {

      this.router.navigate([
        '/tabs/products'
      ]);

      return;
    }


    /* =========================================
       UNKNOWN ROLE
    ========================================= */

    this.errorMessage =
      'Invalid user role. Please contact the administrator.';

    this.authService.logout();

    this.cdr.detectChanges();

  }


  /* =========================================
     SEND OTP / VERIFY OTP
  ========================================= */

  onLogin(): void {

    this.errorMessage = '';


    /* =========================================
       VALIDATE FORM
    ========================================= */

    if (this.loginForm.invalid) {

      this.loginForm.markAllAsTouched();

      this.cdr.detectChanges();

      return;
    }


    /* =========================================
       LOADING
    ========================================= */

    this.isLoading = true;

    this.cdr.detectChanges();


    const mobileNumber =
      this.mobileNumber?.value;

    const otp =
      this.otp?.value;


    /* =========================================
       REQUEST
    ========================================= */

    const request = this.isOtpStep
      ? {
          mobileNumber,
          otp
        }
      : {
          mobileNumber
        };


    /* =========================================
       API
    ========================================= */

    this.authService
      .login(request)
      .subscribe({

        next: (response) => {

          this.isLoading = false;


          /* =====================================
             API SUCCESS
          ===================================== */

          if (response?.success === true) {


            /* ===================================
               FIRST STEP
               OTP SENT
            =================================== */

            if (!this.isOtpStep) {

              this.isOtpStep = true;

              this.otp?.reset();


              /* Make OTP required */

              this.otp?.setValidators([
                Validators.required,
                Validators.pattern('^[0-9]{6}$')
              ]);

              this.otp?.updateValueAndValidity();


              this.errorMessage = '';

              this.cdr.detectChanges();

              return;
            }


            /* ===================================
               SECOND STEP
               OTP VERIFIED

               AuthService has already stored
               the access token and role.
            =================================== */

            this.redirectByRole();

            return;
          }


          /* =====================================
             API FAILURE
          ===================================== */

          this.errorMessage =
            response?.message ||
            (
              this.isOtpStep
                ? 'Invalid OTP. Please try again.'
                : 'Unable to send OTP. Please try again.'
            );

          this.cdr.detectChanges();

        },


        /* =====================================
           HTTP ERROR
        ===================================== */

        error: (error) => {

          this.isLoading = false;

          this.errorMessage =
            error?.error?.message ||
            (
              this.isOtpStep
                ? 'OTP verification failed. Please try again.'
                : 'Unable to send OTP. Please try again.'
            );

          this.cdr.detectChanges();

        }

      });

  }


  /* =========================================
     CHANGE MOBILE NUMBER
  ========================================= */

  changeMobileNumber(): void {

    this.isOtpStep = false;

    this.otp?.reset();


    /* Remove OTP required validator */

    this.otp?.setValidators([
      Validators.pattern('^[0-9]{6}$')
    ]);

    this.otp?.updateValueAndValidity();


    this.errorMessage = '';

    this.cdr.detectChanges();

  }


  /* =========================================
     GO TO HOME
  ========================================= */

  goToHome(): void {

    this.router.navigate([
      '/tabs/home'
    ]);

  }

}