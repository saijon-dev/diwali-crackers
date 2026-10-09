import {
  ChangeDetectorRef,
  Component,
  OnInit
} from '@angular/core';

import {
  IonContent,
  IonIcon,
  IonSelectOption,
  IonSelect,
  ToastController
} from '@ionic/angular';

import { FormsModule } from '@angular/forms';

import { Router } from '@angular/router';

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
  checkmarkCircleOutline
} from 'ionicons/icons';

import {
  ProductService,
  VendorProduct,
  VendorProductPage
} from '../../../services/product.service';

import { HttpClient } from '@angular/common/http';

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
    IonSelectOption,
    IonSelect
  ]
})
export class VendProductsPage implements OnInit {

  searchText = '';

  selectedCategory = 'ALL';

  categories: Category[] = [];

  products: VendorProduct[] = [];

  filteredProducts: VendorProduct[] = [];

  isLoadingProducts = true;
  isLoadingCategories = true;

  isAddProductView = false;

  errorMessage = '';

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
      checkmarkCircleOutline
    });

  }


ngOnInit(): void {
  this.loadCategories();
}

ionViewWillEnter(): void {
  // Reload data whenever the page is entered
  this.loadCategories();
  this.loadVendorProducts();

  // Show success toast passed during navigation
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

        this.cdr.detectChanges();

      },

      error: (error) => {

        console.error(
          'Failed to load categories:',
          error
        );

        this.categories = [];

        this.isLoadingCategories = false;

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

  this.productService
    .getVendorProducts()
    .subscribe({

      next: (response: VendorProductPage) => {

        this.products = response?.content ?? [];

        // Get the storeId from the first product that has a valid ID.
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

        this.cdr.detectChanges();
      },

      error: (error) => {

        console.error(
          'Failed to load vendor products:',
          error
        );

        this.products = [];
        this.filteredProducts = [];

        this.errorMessage =
          'Unable to load your products.';

        this.isLoadingProducts = false;

        this.cdr.detectChanges();
      }

    });
}

  // =====================================================
  // SEARCH + CATEGORY FILTER
  // =====================================================

  applyFilters(): void {

    const search =
      this.searchText
        .trim()
        .toLowerCase();


    this.filteredProducts =
      this.products.filter(product => {

        const matchesSearch =
          !search ||
          product.productName
            ?.toLowerCase()
            .includes(search) ||
          product.brandName
            ?.toLowerCase()
            .includes(search) ||
          product.categoryName
            ?.toLowerCase()
            .includes(search);


        const matchesCategory =
          this.selectedCategory === 'ALL' ||
          product.categoryName ===
            this.selectedCategory;


        return (
          matchesSearch &&
          matchesCategory
        );

      });

  }


  onSearchChange(): void {

    this.applyFilters();

  }


  onCategoryChange(): void {

    this.applyFilters();

  }


  clearSearch(): void {

    this.searchText = '';

    this.applyFilters();

  }


  // =====================================================
  // PRODUCT IMAGE
  // =====================================================

getProductImage(
  product: VendorProduct
): string {

  if (
    product.images &&
    product.images.length > 0
  ) {

    return product.images[0].imageUrl;

  }

  return 'assets/images/rectangle-image.png';

}

  // =====================================================
  // PRODUCT PRICE
  // =====================================================

  formatPrice(
    price: number
  ): string {

    if (
      price === null ||
      price === undefined
    ) {

      return '₹0';

    }

    return `₹${price}`;

  }


  // =====================================================
  // STOCK
  // =====================================================

  getStockText(
    product: VendorProduct
  ): string {

    if (!product.isAvailable) {
      return 'Unavailable';
    }

    if (product.stockQuantity <= 0) {
      return 'Out of stock';
    }

    return `${product.stockQuantity} in stock`;

  }


  getStockClass(
    product: VendorProduct
  ): string {

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

    this.router.navigate([
      '/tabs/products'
    ]);

  }


  // =====================================================
  // PRODUCT CLICK
  // =====================================================
openProduct(product: VendorProduct): void {
  this.router.navigate(
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


  openNewProductForm(): void {
  this.isAddProductView = true;

  this.router.navigate(['/tabs/admin-edit', 'new'], {
    state: {
      isNewProduct: true
    }
  });
}

}