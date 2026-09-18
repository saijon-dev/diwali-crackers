import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

export interface LoginRequest {
  mobileNumber: string;
  otp?: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  accessToken?: string;
  refreshToken?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private http: HttpClient) {}

  login(request: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(
      `${environment.apiUrl}/auth/login`,
      request
    ).pipe(
      tap(response => {

        // Only store data after successful login
        if (
          response?.success === true &&
          response?.accessToken
        ) {
          this.storeLoginData(response);
        }

      })
    );
  }

  private storeLoginData(response: LoginResponse): void {

    const accessToken = response.accessToken!;

    // Store tokens
    localStorage.setItem('accessToken', accessToken);

    if (response.refreshToken) {
      localStorage.setItem(
        'refreshToken',
        response.refreshToken
      );
    }

    // Decode JWT payload
    const payload = this.decodeJwtPayload(accessToken);

    console.log('JWT Payload:', payload);

    // Get role from JWT
    const role = payload?.role;

    if (role) {
      localStorage.setItem('role', role);
    }

    console.log('Stored Role:', role);
  }

  private decodeJwtPayload(token: string): any {

    try {

      const payloadBase64 = token.split('.')[1];

      const base64 = payloadBase64
        .replace(/-/g, '+')
        .replace(/_/g, '/');

      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(
            char =>
              '%' +
              ('00' + char.charCodeAt(0).toString(16)).slice(-2)
          )
          .join('')
      );

      return JSON.parse(jsonPayload);

    } catch (error) {

      console.error('Unable to decode JWT:', error);

      return null;
    }
  }

  getRole(): string | null {
    return localStorage.getItem('role');
  }

  getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('accessToken');
  }

  logout(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('role');
  }
}