
import {
  ChangeDetectorRef,
  Component,
  OnInit
} from '@angular/core';

import {
  IonContent,
  IonIcon,
  ToastController,
  IonRefresher,
  IonRefresherContent
} from '@ionic/angular';

import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { addIcons } from 'ionicons';

import {
  arrowBackOutline,
  searchOutline,
  closeOutline,
  chevronDownOutline,
  imageOutline,
  cubeOutline,
  alertCircleOutline,
  addOutline,
  logOutOutline,
  checkmarkCircleOutline
} from 'ionicons/icons';

import {
  ProductService,
  VendorProduct,
  VendorProductPage
} from '../../../services/product.service';

import { environment } from '../../../../environments/environment';
import { VendorService } from '../../../services/vendor.service';

interface Category {
  categoryId: number;
  categoryName: string;
  description?: string;
  imageUrl?: string;
}

@Component({
  selector: 'app-vend-products',
  templateUrl: './vend-products.page.html',
  standalone: true,
  imports: [
    IonContent,
    IonIcon,
    FormsModule,
    IonRefresher,
    IonRefresherContent
  ]
})
export class VendProductsPage implements OnInit {

  searchText = '';

  // Use category names so filtering works with the existing
  // VendorProduct interface without requiring categoryId.
  selectedCategory = 'ALL';

  categories: Category[] = [];
  products: VendorProduct[] = [];
  filteredProducts: VendorProduct[] = [];

  isLoadingProducts = true;
  isLoadingCategories = true;

  errorMessage = '';

   showLogoutConfirmation = false;

  private activeRefresher: HTMLIonRefresherElement | null = null;

  constructor(
    private productService: ProductService,
    private http: HttpClient,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private toastController: ToastController,
    private vendorService: VendorService
  ) {
    addIcons({
      arrowBackOutline,
      searchOutline,
      closeOutline,
      chevronDownOutline,
      imageOutline,
      cubeOutline,
      alertCircleOutline,
      addOutline,
      checkmarkCircleOutline,
      logOutOutline
    });
  }

  ngOnInit(): void {
    this.loadCategories();
  }

  ionViewWillEnter(): void {
    this.loadCategories();
    this.loadVendorProducts();

    const state = history.state;

    if (state?.toastMessage && state?.toastType === 'success') {
      void this.showProductToast(state.toastMessage, true);

      history.replaceState(
        {
          ...state,
          toastMessage: null,
          toastType: null
        },
        ''
      );
    }
  }

  handleRefresh(event: CustomEvent): void {
    this.activeRefresher =
      event.target as HTMLIonRefresherElement;

    this.loadCategories();
    this.loadVendorProducts();
  }

  private completeRefresher(): void {
    const refresher = this.activeRefresher;
    this.activeRefresher = null;

    if (refresher) {
      void refresher.complete();
    }
  }

  private async showProductToast(
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

  // =====================================================
  // LOAD CATEGORIES
  // =====================================================

  loadCategories(): void {
    this.isLoadingCategories = true;

    this.http.get<Category[]>(
      `${environment.apiUrl}/categories`
    ).subscribe({
      next: (response) => {
        this.categories = response ?? [];
        this.isLoadingCategories = false;

        this.applyFilters();
        this.completeRefresher();
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Failed to load categories:', error);

        this.categories = [];
        this.isLoadingCategories = false;

        this.completeRefresher();
        this.cdr.detectChanges();
      }
    });
  }

  // =====================================================
  // LOAD VENDOR PRODUCTS
  // =====================================================

  loadVendorProducts(): void {
    this.isLoadingProducts = true;
    this.errorMessage = '';

    this.productService.getVendorProducts().subscribe({
      next: (response: VendorProductPage) => {
        this.products = response?.content ?? [];

        const storeId = this.products.find(
          product =>
            product.storeId !== undefined &&
            Number.isInteger(product.storeId) &&
            product.storeId > 0
        )?.storeId;

        if (storeId !== undefined) {
          this.vendorService.setCurrentStoreId(storeId);
          console.log('Saved Store ID:', storeId);
        } else {
          console.warn(
            'No valid storeId found in vendor products response.'
          );
        }

        this.applyFilters();

        this.isLoadingProducts = false;
        this.completeRefresher();
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Failed to load vendor products:', error);

        this.products = [];
        this.filteredProducts = [];
        this.errorMessage = 'Unable to load your products.';

        this.isLoadingProducts = false;
        this.completeRefresher();
        this.cdr.detectChanges();
      }
    });
  }

  // =====================================================
  // SEARCH + CATEGORY SCROLLER
  // =====================================================

  applyFilters(): void {
    const search = this.searchText.trim().toLowerCase();

    this.filteredProducts = this.products.filter(product => {
      const matchesSearch =
        !search ||
        product.productName?.toLowerCase().includes(search) ||
        product.brandName?.toLowerCase().includes(search) ||
        product.categoryName?.toLowerCase().includes(search);

      const matchesCategory =
        this.selectedCategory === 'ALL' ||
        product.categoryName === this.selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  selectCategory(categoryName: string): void {
    this.selectedCategory = categoryName;
    this.applyFilters();
  }

  clearSearch(): void {
    this.searchText = '';
    this.applyFilters();
  }

  showAllProducts(): void {
    this.searchText = '';
    this.selectedCategory = 'ALL';
    this.applyFilters();
  }

  // =====================================================
  // ADD PRODUCT
  // =====================================================

  addProduct(): void {
    void this.router.navigate(['/tabs/products']);
  }

  // =====================================================
  // PRODUCT IMAGE
  // =====================================================

  getProductImage(product: VendorProduct): string {
    if (product.images && product.images.length > 0) {
      return product.images[0].imageUrl;
    }

    return 'assets/images/rectangle-image.png';
  }

  // =====================================================
  // PRODUCT PRICE
  // =====================================================

  formatPrice(price: number): string {
    if (price === null || price === undefined) {
      return '₹0';
    }

    return `₹${price}`;
  }

  // =====================================================
  // STOCK
  // =====================================================

  getStockText(product: VendorProduct): string {
    if (!product.isAvailable) {
      return 'Unavailable';
    }

    if (product.stockQuantity <= 0) {
      return 'Out of stock';
    }

    return `${product.stockQuantity} in stock`;
  }

  getStockClass(product: VendorProduct): string {
    if (!product.isAvailable) {
      return 'stock-unavailable';
    }

    if (product.stockQuantity <= 0) {
      return 'stock-out';
    }

    if (product.stockQuantity <= 10) {
      return 'stock-low';
    }

    return 'stock-good';
  }

  // =====================================================
  // BACK
  // =====================================================

  goBack(): void {
    void this.router.navigate(['/tabs/products']);
  }

  // =====================================================
  // PRODUCT CLICK
  // =====================================================

  openProduct(product: VendorProduct): void {
    void this.router.navigate(
      ['/tabs/admin-edit', product.productStoreId],
      {
        state: {
          product
        }
      }
    );
  }

  // =====================================================
  // RETRY
  // =====================================================

  retry(): void {
    this.loadVendorProducts();
    this.loadCategories();
  }



    logout(): void {


    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('role');

    localStorage.removeItem('smartlearn_token');
    localStorage.removeItem('smartlearn_refresh_token');
    localStorage.removeItem('smartlearn_role');
    localStorage.removeItem('smartlearn_user_id');

    this.router.navigate(['/home']);
  }


  confirmLogout(): void {
  this.showLogoutConfirmation = true;
}

cancelLogout(): void {
  this.showLogoutConfirmation = false;
}
}
