import {
  Component,
  OnInit,
  ChangeDetectorRef,
  ElementRef,
  ViewChild
} from '@angular/core';

import {
  CommonModule
} from '@angular/common';

import {
  FormsModule
} from '@angular/forms';

import {
  IonContent,
  IonIcon,
  ToastController
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
  closeOutline,
  imageOutline,
  giftOutline,
  alertCircleOutline
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
  productStoreId?: number;
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

interface SelectedComboProduct {
  product: VendorComboProduct;
  productStoreId?: number;
  quantity: number;
}

interface VendorCombo {
  comboId: number;
  comboName: string;
  description?: string;
  comboSellingPrice: number;
  totalActualPrice: number;
  discountAmount: number;
  discountPercentage: number;
  totalProducts: number;
  totalItemQuantity: number;
  comboImageUrl?: string;

  // Prefer the explicit combo status returned by the API.
  status?: 'ACTIVE' | 'INACTIVE' | string;
  isAvailable?: boolean;

  products: {
    productId: number;
    productStoreId?: number;
    productName: string;
    quantity: number;
    mrp?: number;
    sellingPrice?: number;
    images?: {
      productImageId?: number;
      imageUrl: string;
    }[];
  }[];
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




  showComboImageDialog = false;
selectedComboImage: File | null = null;
comboImagePreview: string | null = null;
isSavingCombo = false;

@ViewChild('comboImageInput')
comboImageInput?: ElementRef<HTMLInputElement>;


  /* ====================================================
     LOADING
  ==================================================== */

  isProductsLoading = false;

  isCategoriesLoading = false;


  /* ====================================================
   VENDOR COMBO LIST
==================================================== */

showComboList = true;

vendorCombos: VendorCombo[] = [];

isCombosLoading = false;

comboSearchTerm = '';

comboLoadError = '';

selectedComboId: number | null = null;

isEditMode = false;


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
  private cdr: ChangeDetectorRef,
  private toastController: ToastController
) {
  addIcons({
    arrowBackOutline,
    searchOutline,
    checkmarkOutline,
    removeOutline,
    addOutline,
    trashOutline,
    closeOutline,
    imageOutline,
    giftOutline,
    alertCircleOutline
  });
}

isComboActive(combo: VendorCombo): boolean {
  if (combo.status) {
    return combo.status.toUpperCase() === 'ACTIVE';
  }

  return combo.isAvailable === true;
}


  /* ====================================================
     INIT
  ==================================================== */

ngOnInit(): void {
  this.loadVendorProducts();
  this.loadCategories();
  this.loadVendorCombos();
}


  /* ====================================================
     BACK
  ==================================================== */

  goBack(): void {

    window.history.back();

  }



  get filteredCombos(): VendorCombo[] {
  const search = this.comboSearchTerm.trim().toLowerCase();

  return this.vendorCombos.filter(combo =>
    combo.comboName?.toLowerCase().includes(search) ||
    combo.description?.toLowerCase().includes(search)
  );
}

openCreateCombo(): void {
  this.resetComboForm();
  this.showComboList = false;
  this.isEditMode = false;
  this.selectedComboId = null;
}

openEditCombo(combo: VendorCombo): void {
  this.resetComboForm();

  this.selectedComboId = combo.comboId;
  this.isEditMode = true;
  this.showComboList = false;

  this.comboName = combo.comboName ?? '';
  this.comboDescription = combo.description ?? '';
  this.comboSellingPrice = Number(combo.comboSellingPrice ?? 0);

  this.selectedProducts = (combo.products ?? []).map(item => {
    const product = this.products.find(
      p => Number(p.productId) === Number(item.productId)
    );

    if (!product) {
      return null;
    }

    return {
      product,
      quantity: Number(item.quantity || 1)
    };
  }).filter(
    (item): item is SelectedComboProduct => item !== null
  );

  this.cdr.detectChanges();
}

backToComboList(): void {
  this.showComboList = true;
  this.selectedComboId = null;
  this.isEditMode = false;

  this.loadVendorCombos();
}

private resetComboForm(): void {
  this.comboName = '';
  this.comboDescription = '';
  this.comboSellingPrice = 0;
  this.selectedProducts = [];
  this.selectedCategoryId = null;
  this.searchTerm = '';
  this.errorMessage = '';
  this.successMessage = '';
}


loadVendorCombos(): void {
  this.isCombosLoading = true;
  this.comboLoadError = '';

  this.productService.getVendorCombos().subscribe({
    next: (response) => {
      console.log('Vendor Combos API response:', response);

      this.vendorCombos = Array.isArray(response)
        ? response
        : [];

      this.isCombosLoading = false;
      this.cdr.detectChanges();
    },

    error: (error) => {
      console.error('Get Vendor Combos Error:', error);

      this.vendorCombos = [];
      this.isCombosLoading = false;
      this.comboLoadError =
        error?.error?.message ||
        error?.message ||
        'Unable to load your combos. Please try again.';

      this.cdr.detectChanges();
    }
  });
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

  if (this.isSavingCombo) {
    return;
  }

  if (this.selectedProducts.length === 0) {
    this.errorMessage = 'Please select at least one product.';
    return;
  }

  if (!this.comboName.trim()) {
    this.errorMessage = 'Please enter a combo name.';
    return;
  }

  if (this.comboSellingPrice <= 0) {
    this.errorMessage = 'Please enter a valid combo selling price.';
    return;
  }

  if (this.isEditMode) {
    this.errorMessage = 'Combo editing is not connected to this POST API yet.';
    return;
  }

  this.selectedComboImage = null;
  this.clearComboImagePreview();
  this.showComboImageDialog = true;
}

private buildComboRequest(): {
  comboName: string;
  description: string;
  comboSellingPrice: number;
  products: { productId: number; quantity: number }[];
} {
  return {
    comboName: this.comboName.trim(),
    description: this.comboDescription.trim(),
    comboSellingPrice: Number(this.comboSellingPrice),
    products: this.selectedProducts.map(item => ({
      productId: Number(item.product.productId),
      quantity: Number(item.quantity)
    }))
  };
}

openComboImagePicker(): void {
  this.comboImageInput?.nativeElement.click();
}

onComboImageSelected(event: Event): void {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];

  if (!file) {
    return;
  }

  if (!file.type.startsWith('image/')) {
    void this.showToast('Please select a valid image.');
    input.value = '';
    return;
  }

  this.clearComboImagePreview();

  this.selectedComboImage = file;
  this.comboImagePreview = URL.createObjectURL(file);
  this.cdr.detectChanges();
}

removeComboImage(): void {
  this.selectedComboImage = null;
  this.clearComboImagePreview();

  if (this.comboImageInput) {
    this.comboImageInput.nativeElement.value = '';
  }

  this.cdr.detectChanges();
}

private clearComboImagePreview(): void {
  if (this.comboImagePreview) {
    URL.revokeObjectURL(this.comboImagePreview);
    this.comboImagePreview = null;
  }
}

cancelComboImageDialog(): void {
  this.showComboImageDialog = false;
  this.removeComboImage();
}

skipComboImage(): void {
  this.submitCombo(null);
}

confirmComboSave(): void {
  if (!this.selectedComboImage) {
    this.openComboImagePicker();
    return;
  }

  this.submitCombo(this.selectedComboImage);
}
private submitCombo(image: File | null): void {
  if (this.isSavingCombo) {
    return;
  }

  this.isSavingCombo = true;

  const comboDetails = this.buildComboRequest();

  this.productService.addCombo(comboDetails, image).subscribe({
next: async (response) => {
  console.log('Combo created successfully:', response);

  this.isSavingCombo = false;
  this.showComboImageDialog = false;

  this.clearComboImagePreview();
  this.selectedComboImage = null;

  this.resetComboForm();

  this.showComboList = true;
  this.isEditMode = false;
  this.selectedComboId = null;

  this.cdr.detectChanges();

  await this.showToast('Combo added successfully.');

  this.loadVendorCombos();
},

    error: async (error) => {
      console.error('Failed to create combo:', error);

      this.isSavingCombo = false;

      await this.showToast(
        error?.error?.message ||
        'Combo was saved, but the response could not be processed. Please check the combo list before retrying.'
      );

      this.cdr.detectChanges();
    }
  });
}
private async showToast(message: string): Promise<void> {
  try {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'top',
      cssClass: 'diwali-toast',
      animated: true,
      translucent: false
    });

    await toast.present();

    console.log('Toast displayed:', message);
  } catch (error) {
    console.error('Unable to display toast:', error);
  }
}


getComboProductImages(
  combo: VendorCombo
): {
  productId: number;
  productName: string;
  imageUrl: string;
}[] {
  return (combo.products ?? [])
    .map(product => ({
      productId: product.productId,
      productName: product.productName,
      imageUrl: product.images?.[0]?.imageUrl|| ''
    }))
    .filter(product => !!product.imageUrl);
}


getProductImageStackTransform(index: number): string {
  const direction = index % 2 === 0 ? -1 : 1;
  const translateX = direction * Math.min(index * 5, 15);
  const rotation = direction * Math.min(5 + index * 2, 12);
  const translateY = index * 2;

  return `translate(${translateX}px, ${translateY}px) rotate(${rotation}deg)`;
}



showComboStatusDialog = false;
selectedStatusCombo: VendorCombo | null = null;
pendingComboStatus: 'ACTIVE' | 'INACTIVE' | null = null;
isUpdatingComboStatus = false;

openComboStatusDialog(combo: VendorCombo): void {
  this.selectedStatusCombo = combo;
  this.pendingComboStatus = combo.isAvailable ? 'INACTIVE' : 'ACTIVE';
  this.showComboStatusDialog = true;
}

cancelComboStatusChange(): void {
  if (this.isUpdatingComboStatus) {
    return;
  }

  this.showComboStatusDialog = false;
  this.selectedStatusCombo = null;
  this.pendingComboStatus = null;
}

confirmComboStatusChange(): void {
  const combo = this.selectedStatusCombo;
  const status = this.pendingComboStatus;

  if (!combo || !status || this.isUpdatingComboStatus) {
    return;
  }

  this.isUpdatingComboStatus = true;

  this.productService.updateComboStatus(combo.comboId, status).subscribe({
    next: async () => {
      this.isUpdatingComboStatus = false;
      this.showComboStatusDialog = false;
      this.selectedStatusCombo = null;
      this.pendingComboStatus = null;

      await this.showToast(
        status === 'INACTIVE'
          ? 'Combo made inactive successfully.'
          : 'Combo made active successfully.'
      );

      this.loadVendorCombos();
      this.cdr.detectChanges();
    },
    error: async (error: any) => {
      console.error('Update combo status error:', error);

      this.isUpdatingComboStatus = false;

      await this.showToast(
        error?.error?.message ||
        'Unable to update combo status. Please try again.'
      );

      this.cdr.detectChanges();
    }
  });
}



}