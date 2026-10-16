
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { App } from '@capacitor/app';

import { Observable, tap } from 'rxjs';

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
  userId?: number | string;
  sub?: string;
  [key: string]: any;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  /* ====================================================
     SESSION CONFIGURATION
  ==================================================== */

  private readonly SESSION_DURATION =
    5 * 60 * 60 * 1000; // 5 hours

  private sessionTimer: ReturnType<typeof setTimeout> | null = null;

  private isExpiringSession = false;

  private appStateListenerRegistered = false;

  constructor(
    private http: HttpClient,
    private router: Router,
    private toastController: ToastController
  ) {
    this.initializeSession();
  }

  /* ====================================================
     LOGIN

     STEP 1:
     Mobile number -> OTP

     STEP 2:
     Mobile number + OTP -> JWT
  ==================================================== */

  login(request: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(
        `${environment.apiUrl}/login`,
        {
          ...request,
          identifier: 'diwali'
        }
      )
      .pipe(
        tap(response => {
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

  private storeLoginData(response: LoginResponse): void {
    const accessToken = response.accessToken;

    if (!accessToken) {
      return;
    }

    // Validate the JWT payload before accepting the session.
    const payload = this.decodeJwtPayload(accessToken);

    if (!payload) {
      this.clearAuthData();
      return;
    }

    // Do not start a session with an already-expired JWT.
    if (
      payload.exp &&
      payload.exp * 1000 <= Date.now()
    ) {
      this.clearAuthData();
      return;
    }

    localStorage.setItem('accessToken', accessToken);

    if (response.refreshToken) {
      localStorage.setItem(
        'refreshToken',
        response.refreshToken
      );
    } else {
      localStorage.removeItem('refreshToken');
    }

    const role = this.normalizeRole(payload.role);

    if (role) {
      localStorage.setItem('role', role);
    } else {
      localStorage.removeItem('role');
    }

    // Start a fresh five-hour session after successful login.
    localStorage.setItem(
      'loginTimestamp',
      Date.now().toString()
    );

    this.isExpiringSession = false;

    this.startSessionTimer();
    this.registerAppStateListener();
  }

  /* ====================================================
     INITIALIZE EXISTING SESSION
  ==================================================== */

  private initializeSession(): void {
    if (!this.getAccessToken()) {
      return;
    }

    /*
     * Existing sessions created before this feature may
     * not have a loginTimestamp. Use the JWT iat claim
     * when available so restarting the app does not
     * automatically grant another five hours.
     */

    if (!localStorage.getItem('loginTimestamp')) {
      const payload = this.getTokenPayload();

      const timestamp = payload?.iat
        ? payload.iat * 1000
        : Date.now();

      localStorage.setItem(
        'loginTimestamp',
        timestamp.toString()
      );
    }

    this.checkSessionExpiry();
    this.registerAppStateListener();
  }

  /* ====================================================
     REGISTER APP FOREGROUND LISTENER
  ==================================================== */

  private registerAppStateListener(): void {
    if (this.appStateListenerRegistered) {
      return;
    }

    this.appStateListenerRegistered = true;

    void App.addListener(
      'appStateChange',
      ({ isActive }) => {
        if (isActive) {
          this.checkSessionExpiry();
        }
      }
    ).catch(() => {
      // Browser environments may not support Capacitor App.
      this.appStateListenerRegistered = false;
    });
  }

  /* ====================================================
     START SESSION TIMER
  ==================================================== */

  private startSessionTimer(): void {
    if (this.sessionTimer) {
      clearTimeout(this.sessionTimer);
      this.sessionTimer = null;
    }

    const token = this.getAccessToken();

    if (!token) {
      return;
    }

    const loginTimestamp = Number(
      localStorage.getItem('loginTimestamp')
    );

    if (!Number.isFinite(loginTimestamp)) {
      void this.expireSession();
      return;
    }

    const payload = this.decodeJwtPayload(token);

    if (!payload) {
      void this.expireSession();
      return;
    }

    const sessionExpiry =
      loginTimestamp + this.SESSION_DURATION;

    const jwtExpiry = payload.exp
      ? payload.exp * 1000
      : Number.POSITIVE_INFINITY;

    // Whichever expires first ends the session.
    const expiryTime = Math.min(
      sessionExpiry,
      jwtExpiry
    );

    const remainingTime = expiryTime - Date.now();

    if (remainingTime <= 0) {
      void this.expireSession();
      return;
    }

    this.sessionTimer = setTimeout(() => {
      this.checkSessionExpiry();
    }, remainingTime);
  }

  /* ====================================================
     CHECK SESSION EXPIRY
  ==================================================== */

  private checkSessionExpiry(): void {
    if (!this.getAccessToken()) {
      return;
    }

    const loginTimestamp = Number(
      localStorage.getItem('loginTimestamp')
    );

    if (!Number.isFinite(loginTimestamp)) {
      void this.expireSession();
      return;
    }

    const sessionExpired =
      Date.now() >=
      loginTimestamp + this.SESSION_DURATION;

    if (sessionExpired || this.isTokenExpired()) {
      void this.expireSession();
      return;
    }

    // Re-arm the timer in case the app was suspended.
    this.startSessionTimer();
  }

  /* ====================================================
     EXPIRE SESSION
  ==================================================== */

  private async expireSession(): Promise<void> {
    if (this.isExpiringSession) {
      return;
    }

    this.isExpiringSession = true;

    this.clearAuthData();

    try {
      await this.router.navigateByUrl(
        '/home',
        { replaceUrl: true }
      );

      const toast = await this.toastController.create({
        message: 'Session expired',
        duration: 2500,
        position: 'top',
        cssClass: 'diwali-toast'
      });

      await toast.present();
    } finally {
      this.isExpiringSession = false;
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

    const normalized = role.trim().toUpperCase();

    return normalized || null;
  }

  /* ====================================================
     DECODE JWT PAYLOAD
  ==================================================== */

  private decodeJwtPayload(
    token: string
  ): JwtPayload | null {
    try {
      const parts = token.split('.');

      if (parts.length !== 3) {
        return null;
      }

      const payloadBase64 = parts[1];

      const base64 = payloadBase64
        .replace(/-/g, '+')
        .replace(/_/g, '/');

      const paddedBase64 = base64.padEnd(
        Math.ceil(base64.length / 4) * 4,
        '='
      );

      const jsonPayload = decodeURIComponent(
        atob(paddedBase64)
          .split('')
          .map(char =>
            '%' +
            (
              '00' +
              char.charCodeAt(0).toString(16)
            ).slice(-2)
          )
          .join('')
      );

      return JSON.parse(jsonPayload);
    } catch {
      return null;
    }
  }

  /* ====================================================
     GET JWT PAYLOAD
  ==================================================== */

  getTokenPayload(): JwtPayload | null {
    const token = this.getAccessToken();

    if (!token) {
      return null;
    }

    return this.decodeJwtPayload(token);
  }

  /* ====================================================
     GET ROLE
  ==================================================== */

  getRole(): string | null {
    const storedRole = localStorage.getItem('role');

    if (storedRole) {
      return this.normalizeRole(storedRole);
    }

    const payload = this.getTokenPayload();

    const role = this.normalizeRole(payload?.role);

    if (role) {
      localStorage.setItem('role', role);
    }

    return role;
  }

  /* ====================================================
     CHECK ROLE
  ==================================================== */

  hasRole(role: string): boolean {
    const currentRole = this.getRole();

    if (!currentRole) {
      return false;
    }

    return currentRole === this.normalizeRole(role);
  }

  /* ====================================================
     GET ACCESS TOKEN
  ==================================================== */

  getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  /* ====================================================
     GET REFRESH TOKEN
  ==================================================== */

  getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }

  /* ====================================================
     CHECK TOKEN EXPIRATION
  ==================================================== */

  isTokenExpired(): boolean {
    const token = this.getAccessToken();

    if (!token) {
      return true;
    }

    const payload = this.decodeJwtPayload(token);

    if (!payload) {
      return true;
    }

    // If exp is absent, only the five-hour client limit applies.
    if (payload.exp == null) {
      return false;
    }

    const currentTime = Math.floor(
      Date.now() / 1000
    );

    return payload.exp <= currentTime;
  }

  /* ====================================================
     CHECK LOGIN STATUS
  ==================================================== */

  isLoggedIn(): boolean {
    const accessToken = this.getAccessToken();

    if (!accessToken) {
      return false;
    }

    const loginTimestamp = Number(
      localStorage.getItem('loginTimestamp')
    );

    const sessionExpired =
      !Number.isFinite(loginTimestamp) ||
      Date.now() >=
        loginTimestamp + this.SESSION_DURATION;

    if (sessionExpired || this.isTokenExpired()) {
      void this.expireSession();
      return false;
    }

    return true;
  }

  /* ====================================================
     CLEAR AUTH DATA
  ==================================================== */

  clearAuthData(): void {
    if (this.sessionTimer) {
      clearTimeout(this.sessionTimer);
      this.sessionTimer = null;
    }

    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('role');
    localStorage.removeItem('loginTimestamp');
  }

  /* ====================================================
     LOGOUT
  ==================================================== */

  logout(): void {
    this.clearAuthData();
  }

  /* ====================================================
     GET USER ID FROM JWT
  ==================================================== */

  getUserId(): number | null {
    const payload = this.getTokenPayload();

    if (payload?.userId == null) {
      return null;
    }

    const userId = Number(payload.userId);

    if (
      !Number.isSafeInteger(userId) ||
      userId <= 0
    ) {
      return null;
    }

    return userId;
  }
}
