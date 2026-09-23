import { Injectable } from '@angular/core';

import {
  HttpClient
} from '@angular/common/http';

import {
  Observable,
  tap
} from 'rxjs';

import { environment } from '../../environments/environment';


/* ====================================================
   LOGIN REQUEST
==================================================== */

export interface LoginRequest {

  mobileNumber: string;

  otp?: string;

}


/* ====================================================
   LOGIN RESPONSE
==================================================== */

export interface LoginResponse {

  success: boolean;

  message: string;

  accessToken?: string;

  refreshToken?: string;

}


/* ====================================================
   JWT PAYLOAD
==================================================== */

interface JwtPayload {

  exp?: number;

  iat?: number;

  role?: string;

  sub?: string;

  [key: string]: any;

}


@Injectable({
  providedIn: 'root'
})
export class AuthService {


  constructor(
    private http: HttpClient
  ) {}


  /* ====================================================
     LOGIN

     STEP 1:
     mobile number → OTP

     STEP 2:
     mobile number + OTP → JWT
  ==================================================== */

  login(
    request: LoginRequest
  ): Observable<LoginResponse> {

    return this.http
      .post<LoginResponse>(
        `${environment.apiUrl}/auth/login`,
        request
      )
      .pipe(

        tap(response => {

          /*
           * Only store authentication data
           * after successful OTP verification.
           *
           * The first API call only sends OTP,
           * so there will normally be no accessToken.
           */

          if (
            response?.success === true &&
            response?.accessToken
          ) {

            this.storeLoginData(response);

          }

        })

      );

  }


  /* ====================================================
     STORE LOGIN DATA
  ==================================================== */

  private storeLoginData(
    response: LoginResponse
  ): void {

    const accessToken =
      response.accessToken;


    if (!accessToken) {

      return;

    }


    /* =========================================
       ACCESS TOKEN
    ========================================= */

    localStorage.setItem(
      'accessToken',
      accessToken
    );


    /* =========================================
       REFRESH TOKEN
    ========================================= */

    if (response.refreshToken) {

      localStorage.setItem(
        'refreshToken',
        response.refreshToken
      );

    }


    /* =========================================
       DECODE JWT
    ========================================= */

    const payload =
      this.decodeJwtPayload(
        accessToken
      );


    if (!payload) {

      /*
       * If the access token cannot be decoded,
       * don't keep invalid authentication state.
       */

      this.clearAuthData();

      return;

    }


    /* =========================================
       ROLE
    ========================================= */

    const role =
      this.normalizeRole(
        payload.role
      );


    if (role) {

      localStorage.setItem(
        'role',
        role
      );

    }

  }


  /* ====================================================
     NORMALIZE ROLE
  ==================================================== */

  private normalizeRole(
    role: string | null | undefined
  ): string | null {

    if (!role) {

      return null;

    }


    const normalized =
      role
        .trim()
        .toUpperCase();


    return normalized || null;

  }


  /* ====================================================
     DECODE JWT PAYLOAD
  ==================================================== */

  private decodeJwtPayload(
    token: string
  ): JwtPayload | null {

    try {

      const parts =
        token.split('.');


      /*
       * JWT must contain:
       *
       * header.payload.signature
       */

      if (parts.length !== 3) {

        return null;

      }


      const payloadBase64 =
        parts[1];


      const base64 =
        payloadBase64
          .replace(/-/g, '+')
          .replace(/_/g, '/');


      /*
       * Add missing Base64 padding.
       */

      const paddedBase64 =
        base64
          .padEnd(
            Math.ceil(base64.length / 4) * 4,
            '='
          );


      const jsonPayload =
        decodeURIComponent(

          atob(paddedBase64)
            .split('')
            .map(char =>
              '%' +
              (
                '00' +
                char
                  .charCodeAt(0)
                  .toString(16)
              ).slice(-2)
            )
            .join('')

        );


      return JSON.parse(
        jsonPayload
      );

    } catch {

      return null;

    }

  }


  /* ====================================================
     GET JWT PAYLOAD
  ==================================================== */

  getTokenPayload(): JwtPayload | null {

    const token =
      this.getAccessToken();


    if (!token) {

      return null;

    }


    return this.decodeJwtPayload(
      token
    );

  }


  /* ====================================================
     GET ROLE
  ==================================================== */

  getRole(): string | null {

    /*
     * Prefer the role stored during login.
     */

    const storedRole =
      localStorage.getItem('role');


    if (storedRole) {

      return this.normalizeRole(
        storedRole
      );

    }


    /*
     * Fallback:
     * read role directly from JWT.
     */

    const payload =
      this.getTokenPayload();


    const role =
      this.normalizeRole(
        payload?.role
      );


    if (role) {

      localStorage.setItem(
        'role',
        role
      );

    }


    return role;

  }


  /* ====================================================
     CHECK ROLE
  ==================================================== */

  hasRole(
    role: string
  ): boolean {

    const currentRole =
      this.getRole();


    if (!currentRole) {

      return false;

    }


    return (
      currentRole ===
      this.normalizeRole(role)
    );

  }


  /* ====================================================
     GET ACCESS TOKEN
  ==================================================== */

  getAccessToken(): string | null {

    return localStorage.getItem(
      'accessToken'
    );

  }


  /* ====================================================
     GET REFRESH TOKEN
  ==================================================== */

  getRefreshToken(): string | null {

    return localStorage.getItem(
      'refreshToken'
    );

  }


  /* ====================================================
     CHECK TOKEN EXPIRATION
  ==================================================== */

  isTokenExpired(): boolean {

    const payload =
      this.getTokenPayload();


    /*
     * If there is no valid payload,
     * consider the token invalid.
     */

    if (!payload) {

      return true;

    }


    /*
     * If the backend doesn't provide
     * an exp claim, we cannot check
     * expiration locally.
     *
     * In that case, don't mark it
     * as expired.
     */

    if (!payload.exp) {

      return false;

    }


    /*
     * JWT exp is in seconds.
     * Date.now() is milliseconds.
     */

    const currentTime =
      Math.floor(
        Date.now() / 1000
      );


    return (
      payload.exp <= currentTime
    );

  }


  /* ====================================================
     CHECK LOGIN STATUS
  ==================================================== */

  isLoggedIn(): boolean {

    const accessToken =
      this.getAccessToken();


    /*
     * No token
     */

    if (!accessToken) {

      return false;

    }


    /*
     * Invalid / expired token
     */

    if (this.isTokenExpired()) {

      this.clearAuthData();

      return false;

    }


    return true;

  }


  /* ====================================================
     CLEAR AUTH DATA
  ==================================================== */

  clearAuthData(): void {

    localStorage.removeItem(
      'accessToken'
    );

    localStorage.removeItem(
      'refreshToken'
    );

    localStorage.removeItem(
      'role'
    );

  }


  /* ====================================================
     LOGOUT
  ==================================================== */

  logout(): void {

    this.clearAuthData();

  }

}