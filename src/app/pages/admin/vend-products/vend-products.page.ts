import {
  ChangeDetectorRef,
  Component,
  OnInit
} from '@angular/core';

import {
  IonContent,
  IonIcon
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
  alertCircleOutline
} from 'ionicons/icons';

import {
  ProductService,
  VendorProduct,
  VendorProductPage
} from '../../../services/product.service';

import { HttpClient } from '@angular/common/http';

import { environment } from '../../../../environments/environment';


interface Category {
  categoryId: number;
  categoryName: string;
  description?: string;
  imageUrl?: string;
}


@Component({
  selector: 'app-vend-products',
  templateUrl: './vend-products.page.html',
  styleUrls: ['./vend-products.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonIcon,
    FormsModule
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

  errorMessage = '';

  constructor(
    private productService: ProductService,
    private http: HttpClient,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {

    addIcons({
      arrowBackOutline,
      searchOutline,
      closeOutline,
      chevronDownOutline,
      imageOutline,
      cubeOutline,
      alertCircleOutline
    });

  }


  ngOnInit(): void {

    this.loadCategories();

    this.loadVendorProducts();

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

          this.products =
            response?.content ?? [];

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
  this.router.navigate([
    '/tabs/admin-edit',
    product.productId
  ]);
}

  // =====================================================
  // RETRY
  // =====================================================

  retry(): void {

    this.loadVendorProducts();

    this.loadCategories();

  }

}