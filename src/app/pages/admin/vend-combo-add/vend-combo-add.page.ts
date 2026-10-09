import {
  Component,
  OnInit,
  ChangeDetectorRef
} from '@angular/core';

import {
  CommonModule
} from '@angular/common';

import {
  FormsModule
} from '@angular/forms';

import {
  IonContent,
  IonIcon
} from '@ionic/angular';

import {
  Router
} from '@angular/router';

import {
  addIcons
} from 'ionicons';

import {
  arrowBackOutline,
  searchOutline,
  checkmarkOutline,
  removeOutline,
  addOutline,
  trashOutline,
  closeOutline
} from 'ionicons/icons';

import {
  ProductService,
  VendorProductPage
} from '../../../services/product.service';

import {
  VendorService
} from '../../../services/vendor.service';


/* ====================================================
   VENDOR COMBO PRODUCT
==================================================== */

interface VendorComboProduct {
  productId: number;
  productName: string;
  categoryId: number;
  categoryName?: string;
  brandName?: string;
  description?: string;
  mrp: number;
  sellingPrice: number;
  stockQuantity: number;
  isAvailable?: boolean;
  images?: {
    productImageId?: number;
    imageUrl: string;
  }[];
  imageUrl?: string;
}


/* ====================================================
   CATEGORY
==================================================== */

interface ComboCategory {
  categoryId: number;
  categoryName: string;
  description?: string;
}


/* ====================================================
   SELECTED PRODUCT
==================================================== */

interface SelectedComboProduct {
  product: VendorComboProduct;
  quantity: number;
}


@Component({
  selector: 'app-vend-combo-add',
  templateUrl: './vend-combo-add.page.html',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonIcon
  ]
})
export class VendComboAddPage implements OnInit {


  /* ====================================================
     LOADING
  ==================================================== */

  isProductsLoading = false;

  isCategoriesLoading = false;


  /* ====================================================
     DATA
  ==================================================== */

  products: VendorComboProduct[] = [];

  categories: ComboCategory[] = [];


  /* ====================================================
     FILTER
  ==================================================== */

  selectedCategoryId: number | null = null;

  searchTerm = '';


  /* ====================================================
     SELECTED PRODUCTS
  ==================================================== */

  selectedProducts: SelectedComboProduct[] = [];


  /* ====================================================
     COMBO PRICE
  ==================================================== */

  comboSellingPrice = 0;


  /* ====================================================
     COMBO DETAILS
  ==================================================== */

  comboName = '';

  comboDescription = '';


  /* ====================================================
     MESSAGE
  ==================================================== */

  errorMessage = '';

  successMessage = '';


  constructor(
    private vendorService: VendorService,
    private productService: ProductService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {

    addIcons({
      arrowBackOutline,
      searchOutline,
      checkmarkOutline,
      removeOutline,
      addOutline,
      trashOutline,
      closeOutline
    });

  }


  /* ====================================================
     INIT
  ==================================================== */

  ngOnInit(): void {

    this.loadVendorProducts();

    this.loadCategories();

  }


  /* ====================================================
     BACK
  ==================================================== */

  goBack(): void {

    window.history.back();

  }


  /* ====================================================
     LOAD VENDOR PRODUCTS
     
     GET /vendor/products

     Vendor token is used by the existing
     authentication/interceptor flow.
  ==================================================== */

  loadVendorProducts(): void {

    this.isProductsLoading = true;

    this.errorMessage = '';

    this.productService
      .getVendorProducts()
      .subscribe({

        next: (response: VendorProductPage) => {

          console.log(
            'Vendor Products:',
            response
          );

          this.products =
            (response?.content ?? []) as VendorComboProduct[];

          this.isProductsLoading = false;

          this.cdr.detectChanges();

        },

        error: (error: any) => {

          console.error(
            'Get Vendor Products Error:',
            error
          );

          this.products = [];

          this.isProductsLoading = false;

          this.errorMessage =
            error?.error?.message ||
            error?.message ||
            'Unable to load your products.';

          this.cdr.detectChanges();

        }

      });

  }


  /* ====================================================
     LOAD CATEGORIES
  ==================================================== */

  loadCategories(): void {

    this.isCategoriesLoading = true;

    this.productService
      .getCategories()
      .subscribe({

        next: (categories: any[]) => {

          this.categories =
            (categories ?? []).map(
              category => ({
                categoryId:
                  category.categoryId,

                categoryName:
                  category.categoryName,

                description:
                  category.description
              })
            );

          this.isCategoriesLoading = false;

          this.cdr.detectChanges();

        },

        error: (error: any) => {

          console.error(
            'Get Categories Error:',
            error
          );

          this.categories = [];

          this.isCategoriesLoading = false;

          this.cdr.detectChanges();

        }

      });

  }


  /* ====================================================
     FILTERED PRODUCTS
  ==================================================== */

  get filteredProducts(): VendorComboProduct[] {

    const search =
      this.searchTerm
        .trim()
        .toLowerCase();

    return this.products.filter(
      product => {

        const matchesCategory =
          this.selectedCategoryId === null ||
          Number(product.categoryId) ===
            Number(this.selectedCategoryId);

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

        return (
          matchesCategory &&
          matchesSearch
        );

      }
    );

  }


  /* ====================================================
     CATEGORY FILTER
  ==================================================== */

  selectCategory(
    categoryId: number | null
  ): void {

    this.selectedCategoryId =
      categoryId;

  }


  /* ====================================================
     PRODUCT SELECTION
  ==================================================== */

  isProductSelected(
    productId: number
  ): boolean {

    return this.selectedProducts.some(
      item =>
        Number(item.product.productId) ===
        Number(productId)
    );

  }


  toggleProduct(
    product: VendorComboProduct
  ): void {

    if (
      product.stockQuantity <= 0 ||
      product.isAvailable === false
    ) {
      return;
    }

    const index =
      this.selectedProducts.findIndex(
        item =>
          Number(item.product.productId) ===
          Number(product.productId)
      );

    if (index >= 0) {

      this.selectedProducts.splice(
        index,
        1
      );

    } else {

      this.selectedProducts.push({
        product,
        quantity: 1
      });

    }

    this.updateComboPrice();

    this.cdr.detectChanges();

  }


  /* ====================================================
     INCREASE QUANTITY
  ==================================================== */

  increaseSelectedQuantity(
    item: SelectedComboProduct
  ): void {

    if (
      item.quantity >=
      item.product.stockQuantity
    ) {
      return;
    }

    item.quantity++;

    this.updateComboPrice();

  }


  /* ====================================================
     DECREASE QUANTITY
  ==================================================== */

  decreaseSelectedQuantity(
    item: SelectedComboProduct
  ): void {

    if (
      item.quantity <= 1
    ) {
      return;
    }

    item.quantity--;

    this.updateComboPrice();

  }


  /* ====================================================
     REMOVE SELECTED PRODUCT
  ==================================================== */

  removeSelectedProduct(
    productId: number
  ): void {

    this.selectedProducts =
      this.selectedProducts.filter(
        item =>
          Number(item.product.productId) !==
          Number(productId)
      );

    this.updateComboPrice();

  }


  /* ====================================================
     CLEAR ALL
  ==================================================== */

  clearSelectedProducts(): void {

    this.selectedProducts = [];

    this.comboSellingPrice = 0;

  }


  /* ====================================================
     SELECTED PRODUCT COUNT
  ==================================================== */

  get selectedProductCount(): number {

    return this.selectedProducts.length;

  }


  /* ====================================================
     TOTAL QUANTITY
  ==================================================== */

  get selectedItemQuantity(): number {

    return this.selectedProducts.reduce(
      (total, item) =>
        total + item.quantity,
      0
    );

  }


  /* ====================================================
     ACTUAL PRICE

     Based on MRP
  ==================================================== */

  get totalActualPrice(): number {

    return this.selectedProducts.reduce(
      (total, item) =>
        total +
        (
          Number(item.product.mrp || 0) *
          item.quantity
        ),
      0
    );

  }


  /* ====================================================
     NORMAL SELLING PRICE
  ==================================================== */

  get totalProductSellingPrice(): number {

    return this.selectedProducts.reduce(
      (total, item) =>
        total +
        (
          Number(
            item.product.sellingPrice || 0
          ) *
          item.quantity
        ),
      0
    );

  }


  /* ====================================================
     INITIAL COMBO PRICE
  ==================================================== */

  updateComboPrice(): void {

    if (
      this.totalActualPrice <= 0
    ) {

      this.comboSellingPrice = 0;

      return;

    }

    /*
     * When products are first selected,
     * set the combo price below the actual
     * total price.
     */

    if (
      this.comboSellingPrice <= 0
    ) {

      this.comboSellingPrice =
        Math.round(
          this.totalActualPrice * 0.81
        );

    }

    if (
      this.comboSellingPrice >
      this.totalActualPrice
    ) {

      this.comboSellingPrice =
        this.totalActualPrice;

    }

  }


  /* ====================================================
     COMBO PRICE CHANGE
  ==================================================== */

  onComboPriceChange(): void {

    if (
      this.totalActualPrice <= 0
    ) {

      this.comboSellingPrice = 0;

      return;

    }

    if (
      this.comboSellingPrice < 1
    ) {

      this.comboSellingPrice = 1;

    }

    if (
      this.comboSellingPrice >
      this.totalActualPrice
    ) {

      this.comboSellingPrice =
        this.totalActualPrice;

    }

    this.cdr.detectChanges();

  }


  /* ====================================================
     DISCOUNT AMOUNT
  ==================================================== */

  get discountAmount(): number {

    return Math.max(
      0,
      this.totalActualPrice -
      this.comboSellingPrice
    );

  }


  /* ====================================================
     DISCOUNT PERCENTAGE
  ==================================================== */

  get discountPercentage(): number {

    if (
      this.totalActualPrice <= 0
    ) {

      return 0;

    }

    return Math.round(
      (
        this.discountAmount /
        this.totalActualPrice
      ) * 100
    );

  }


  /* ====================================================
     PRODUCT IMAGE
  ==================================================== */

  getProductImage(
    product: VendorComboProduct
  ): string {

    if (
      product.images &&
      product.images.length > 0
    ) {

      return (
        product.images[0]?.imageUrl ||
        'assets/images/product-placeholder.png'
      );

    }

    if (product.imageUrl) {

      return product.imageUrl;

    }

    return 'assets/images/product-placeholder.png';

  }


  /* ====================================================
     PRODUCT STOCK STATUS
  ==================================================== */

  isOutOfStock(
    product: VendorComboProduct
  ): boolean {

    return (
      product.stockQuantity <= 0 ||
      product.isAvailable === false
    );

  }


  /* ====================================================
     SAVE COMBO
  ==================================================== */

  saveCombo(): void {

    this.errorMessage = '';

    this.successMessage = '';

    if (
      this.selectedProducts.length === 0
    ) {

      this.errorMessage =
        'Please select at least one product.';

      return;

    }

    if (
      !this.comboName.trim()
    ) {

      this.errorMessage =
        'Please enter a combo name.';

      return;

    }

    if (
      this.comboSellingPrice <= 0
    ) {

      this.errorMessage =
        'Please enter a valid combo selling price.';

      return;

    }


    /*
     * This is the object that will be sent
     * to the Combo POST API once that API
     * is available.
     */

    const comboRequest = {

      comboName:
        this.comboName.trim(),

      description:
        this.comboDescription.trim(),

      comboSellingPrice:
        this.comboSellingPrice,

      totalActualPrice:
        this.totalActualPrice,

      discountPercentage:
        this.discountPercentage,

      products:
        this.selectedProducts.map(
          item => ({

            productId:
              item.product.productId,

            quantity:
              item.quantity

          })
        )

    };


    console.log(
      'CREATE COMBO REQUEST:',
      comboRequest
    );


    /*
     * Combo creation API is not connected yet.
     */

    this.successMessage =
      'Combo details are ready to save.';

  }

}