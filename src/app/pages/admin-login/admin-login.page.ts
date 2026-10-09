import { CommonModule } from '@angular/common';

import {
  ChangeDetectorRef,
  Component,
  OnDestroy,
  ViewChild
} from '@angular/core';

import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import { Router } from '@angular/router';

import {
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
    IonButton
  ]
})
export class AdminLoginPage implements OnDestroy {

  /* =========================================
     OTP INPUT REFERENCE
  ========================================= */

  @ViewChild('otpInput')
  otpInput?: IonInput;


  /* =========================================
     LOGIN STATE
  ========================================= */

  errorMessage = '';

  isOtpStep = false;

  isLoading = false;


  /* =========================================
     OTP DISPLAY
  ========================================= */

  otpDigits: string[] = [
    '',
    '',
    '',
    '',
    '',
    ''
  ];

  otpFocusedIndex = -1;


  /* =========================================
     OTP TIMER
  ========================================= */

  otpTimeRemaining = 0;

  private otpTimer: ReturnType<typeof setInterval> | null = null;


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
     OTP TIMER
  ========================================= */

  private startOtpTimer(): void {

    this.clearOtpTimer();

    this.otpTimeRemaining = 60;

    this.cdr.detectChanges();


    this.otpTimer = setInterval(() => {

      if (this.otpTimeRemaining > 0) {

        this.otpTimeRemaining--;

        this.cdr.detectChanges();

      }


      if (this.otpTimeRemaining === 0) {

        this.clearOtpTimer();

        this.cdr.detectChanges();

      }

    }, 1000);

  }


  private clearOtpTimer(): void {

    if (this.otpTimer !== null) {

      clearInterval(this.otpTimer);

      this.otpTimer = null;

    }

  }


  get formattedOtpTime(): string {

    const seconds = this.otpTimeRemaining;

    return `00:${seconds.toString().padStart(2, '0')}`;

  }


  /* =========================================
     RESEND OTP
  ========================================= */

  resendOtp(): void {

    if (
      !this.isOtpStep ||
      this.otpTimeRemaining > 0 ||
      this.isLoading
    ) {
      return;
    }


    this.errorMessage = '';

    this.isLoading = true;

    this.cdr.detectChanges();


    const mobileNumber =
      this.mobileNumber?.value;


    this.authService
      .login({
        mobileNumber
      })
      .subscribe({

        next: (response) => {

          this.isLoading = false;


          if (response?.success === true) {

            /* ==============================
               CLEAR OLD OTP
            ============================== */

            this.otp?.reset();

            this.otpDigits = [
              '',
              '',
              '',
              '',
              '',
              ''
            ];

            this.otpFocusedIndex = -1;


            /* ==============================
               START NEW 60 SECOND TIMER
            ============================== */

            this.startOtpTimer();


            this.errorMessage = '';

            this.cdr.detectChanges();


            /* ==============================
               FOCUS OTP
            ============================== */

            setTimeout(() => {

              this.focusOtpInput();

            }, 150);


            return;

          }


          this.errorMessage =
            response?.message ||
            'Unable to resend OTP. Please try again.';

          this.cdr.detectChanges();

        },


        error: (error) => {

          this.isLoading = false;

          this.errorMessage =
            error?.error?.message ||
            'Unable to resend OTP. Please try again.';

          this.cdr.detectChanges();

        }

      });

  }


  /* =========================================
     OTP INPUT
  ========================================= */

  onOtpInput(event: any): void {

    let value =
      event?.detail?.value ?? '';


    /* Allow only numbers */

    value =
      value
        .toString()
        .replace(/\D/g, '')
        .slice(0, 6);


    /* Keep FormControl synchronized */

    if (this.otp?.value !== value) {

      this.otp?.setValue(
        value,
        {
          emitEvent: false
        }
      );

    }


    /* Update six visual boxes */

    this.otpDigits =
      Array.from(
        {
          length: 6
        },
        (_, index) =>
          value[index] || ''
      );


    /* Determine active box */

    if (value.length < 6) {

      this.otpFocusedIndex =
        value.length;

    } else {

      this.otpFocusedIndex = 5;

    }


    /* Clear API error */

    if (value.length > 0) {

      this.errorMessage = '';

    }


    this.cdr.detectChanges();

  }


  /* =========================================
     OTP FOCUS
  ========================================= */

  onOtpFocus(): void {

    const value =
      this.otp?.value || '';


    this.otpFocusedIndex =
      Math.min(
        value.length,
        5
      );


    this.cdr.detectChanges();

  }


  /* =========================================
     OTP BLUR
  ========================================= */

  onOtpBlur(): void {

    this.otpFocusedIndex = -1;

    this.cdr.detectChanges();

  }


  /* =========================================
     FOCUS OTP INPUT
  ========================================= */

  async focusOtpInput(): Promise<void> {

    if (!this.isOtpStep) {
      return;
    }


    try {

      await this.otpInput?.setFocus();

    } catch {

      /*
       * Ignore focus errors caused by
       * Ionic rendering timing.
       */

    }

  }


  /* =========================================
     ROLE BASED REDIRECTION
  ========================================= */

  private redirectByRole(): void {

    const role =
      this.authService.getRole();


    /* =====================================
       ADMIN
    ===================================== */

    if (role === 'ADMIN') {

      this.router.navigate([
        '/tabs/adm-vendors'
      ]);

      return;

    }


    /* =====================================
       VENDOR
    ===================================== */

    if (role === 'VENDOR') {

      this.router.navigate([
        '/tabs/products'
      ]);

      return;

    }


    /* =====================================
       UNKNOWN ROLE
    ===================================== */

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


    /* =====================================
       VALIDATE FORM
    ===================================== */

    if (this.loginForm.invalid) {

      this.loginForm.markAllAsTouched();

      this.cdr.detectChanges();

      return;

    }


    /* =====================================
       LOADING
    ===================================== */

    this.isLoading = true;

    this.cdr.detectChanges();


    const mobileNumber =
      this.mobileNumber?.value;

    const otp =
      this.otp?.value;


    /* =====================================
       REQUEST
    ===================================== */

    const request = this.isOtpStep
      ? {
          mobileNumber,
          otp
        }
      : {
          mobileNumber
        };


    /* =====================================
       API
    ===================================== */

    this.authService
      .login(request)
      .subscribe({

        next: (response) => {

          this.isLoading = false;


          /* =================================
             API SUCCESS
          ================================= */

          if (response?.success === true) {


            /* ===============================
               FIRST STEP
               OTP SENT
            =============================== */

            if (!this.isOtpStep) {

              this.isOtpStep = true;

              this.otp?.reset();


              /* Clear visual OTP boxes */

              this.otpDigits = [
                '',
                '',
                '',
                '',
                '',
                ''
              ];

              this.otpFocusedIndex = -1;


              /* Make OTP required */

              this.otp?.setValidators([

                Validators.required,

                Validators.pattern(
                  '^[0-9]{6}$'
                )

              ]);

              this.otp?.updateValueAndValidity();


              this.errorMessage = '';


              /* =============================
                 START 60 SECOND TIMER
              ============================= */

              this.startOtpTimer();


              this.cdr.detectChanges();


              /* =============================
                 FOCUS OTP INPUT
              ============================= */

              setTimeout(() => {

                this.focusOtpInput();

              }, 150);

              return;

            }


            /* ===============================
               SECOND STEP
               OTP VERIFIED
            =============================== */

            this.redirectByRole();

            return;

          }


          /* =================================
             API FAILURE
          ================================= */

          this.errorMessage =
            response?.message ||
            (
              this.isOtpStep
                ? 'Invalid OTP. Please try again.'
                : 'Unable to send OTP. Please try again.'
            );

          this.cdr.detectChanges();

        },


        /* ===================================
           HTTP ERROR
        =================================== */

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

    this.clearOtpTimer();

    this.otpTimeRemaining = 0;

    this.isOtpStep = false;

    this.otp?.reset();


    /* Clear OTP boxes */

    this.otpDigits = [
      '',
      '',
      '',
      '',
      '',
      ''
    ];

    this.otpFocusedIndex = -1;


    /* Remove OTP required validator */

    this.otp?.setValidators([

      Validators.pattern(
        '^[0-9]{6}$'
      )

    ]);

    this.otp?.updateValueAndValidity();


    this.errorMessage = '';

    this.cdr.detectChanges();

  }


  /* =========================================
     GO TO HOME
  ========================================= */

  goToHome(): void {

    this.clearOtpTimer();

    this.router.navigate([
      '/home'
    ]);

  }


  /* =========================================
     COMPONENT DESTROY
  ========================================= */

  ngOnDestroy(): void {

    this.clearOtpTimer();

  }

}