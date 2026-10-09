import {
  Component,
  OnInit,
  ChangeDetectorRef
} from '@angular/core';

import {
  IonContent,
  IonIcon
} from '@ionic/angular';

import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  storefrontOutline
} from 'ionicons/icons';

import {
  VendorService,
  StoreProfile
} from '../../../services/vendor.service';

@Component({
  selector: 'app-shop',
  templateUrl: './shop.page.html',
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonIcon
  ]
})
export class ShopPage implements OnInit {

  store: StoreProfile | null = null;

  isLoading = false;
  errorMessage = '';

  constructor(
    private vendorService: VendorService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    addIcons({
      arrowBackOutline,
      storefrontOutline
    });
  }

  ngOnInit(): void {
    this.loadStoreProfile();
  }

  loadStoreProfile(): void {
    const storeId =
      this.vendorService.getCurrentStoreId();

    if (!storeId) {
      this.errorMessage =
        'Store information is unavailable. Please open your products first and try again.';

      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.vendorService
      .getStoreProfile(storeId)
      .subscribe({
        next: (response) => {
          this.store = response;
          this.isLoading = false;

          this.cdr.detectChanges();
        },

        error: (error) => {
          console.error(
            'Load Store Profile Error:',
            error
          );

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

  retryLoading(): void {
    this.vendorService.clearStoreProfileCache();
    this.loadStoreProfile();
  }

  goBack(): void {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      this.router.navigate(['/vend-products']);
    }
  }
}