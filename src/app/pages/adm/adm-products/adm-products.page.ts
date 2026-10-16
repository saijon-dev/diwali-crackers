import {
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit
} from '@angular/core';

import {
  IonContent,
  IonIcon,
  IonSelectOption,
  IonSelect,
  AlertController,
  ToastController,
  Platform,
  IonRefresher,
  IonRefresherContent
} from '@ionic/angular';

import { FormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import { Subscription } from 'rxjs';

import {
  arrowBackOutline,
  searchOutline,
  addOutline,
  closeOutline,
  cloudUploadOutline,
  trashOutline,
  imageOutline,
  cubeOutline,
  logOutOutline
} from 'ionicons/icons';

import { Router } from '@angular/router';

import {
  AdminProduct,
  Category,
  ProductImage,
  ProductService
} from '../../../services/product.service';

@Component({
  selector: 'app-adm-products',
  templateUrl: './adm-products.page.html',
  standalone: true,
  imports: [
    IonContent,
    IonIcon,
    FormsModule,
    IonSelectOption,
    IonSelect,
    IonRefresher,
    IonRefresherContent
  ]
})
export class AdmProductsPage implements OnInit, OnDestroy {

  // =====================================================
  // CATEGORIES
  // =====================================================
private backButtonSubscription?: Subscription;
  categories: Category[] = [];

  // =====================================================
  // PRODUCTS
  // =====================================================

  products: AdminProduct[] = [];
  isLoadingProducts = false;
  productErrorMessage = '';
  showLogoutConfirmation = false;
  private activeRefresher: HTMLIonRefresherElement | null = null;

  // =====================================================
  // SEARCH
  // =====================================================

  searchText = '';

  // =====================================================
  // PRODUCT FORM
  // =====================================================

  productName = '';
  successMessage = '';
  errorMessage = '';

  productCategoryId: number | null = null;

  productStatus: 'ACTIVE' | 'INACTIVE' = 'ACTIVE';

  // =====================================================
  // ORIGINAL PRODUCT VALUES
  // =====================================================

  private originalProductName = '';
  private originalProductCategoryId: number | null = null;
  private originalProductStatus: 'ACTIVE' | 'INACTIVE' = 'ACTIVE';

  // =====================================================
  // MODAL
  // =====================================================

  isAddProductOpen = false;
  isEditMode = false;
  editingProductId: number | null = null;
  isAddingProduct = false;

  // =====================================================
  // IMAGES
  // =====================================================

  selectedImages: File[] = [];

  // Existing images that are still kept.
  existingImages: ProductImage[] = [];

  // IDs of existing backend images removed by the admin.
  removedImageIds: number[] = [];

  // Preview URLs for newly selected images.
  newImagePreviews: string[] = [];

  // Combined existing and newly selected image previews.
  imagePreviews: string[] = [];

  private objectUrls: string[] = [];

  // Original number of images, used to detect changes.
  private originalImageCount = 0;

  // =====================================================
  // CONSTRUCTOR
  // =====================================================

constructor(
  private router: Router,
  private cdr: ChangeDetectorRef,
  private productService: ProductService,
  private alertController: AlertController,
  private toastController: ToastController,
  private platform: Platform
)  {
    addIcons({
      arrowBackOutline,
      searchOutline,
      addOutline,
      closeOutline,
      cloudUploadOutline,
      trashOutline,
      imageOutline,
      cubeOutline,
      logOutOutline
    });
  }

  // =====================================================
  // INIT
  // =====================================================


handleRefresh(event: CustomEvent): void {
  this.activeRefresher =
    event.target as HTMLIonRefresherElement;

  this.refreshRequestsRemaining = 2;

  this.loadCategories();
  this.loadAdminProducts();
}

private refreshRequestsRemaining = 0;

private completeRefreshRequest(): void {
  if (!this.activeRefresher) {
    return;
  }

  this.refreshRequestsRemaining--;

  if (this.refreshRequestsRemaining <= 0) {
    const refresher = this.activeRefresher;
    this.activeRefresher = null;
    this.refreshRequestsRemaining = 0;

    void refresher.complete();
  }
}




ngOnInit(): void {
  this.loadCategories();
  this.loadAdminProducts();


}


ionViewWillEnter(): void {
  this.loadCategories();

    this.loadAdminProducts();
}

  // =====================================================
  // DESTROY
  // =====================================================

ngOnDestroy(): void {
  this.backButtonSubscription?.unsubscribe();

  this.revokePreviewUrls();

  document.body.classList.remove('adm-modal-open');
}

  // =====================================================
  // TOAST MESSAGE
  // =====================================================

  private async showToast(
    message: string,
    color: 'success' | 'danger' | 'warning' = 'success'
  ): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 2500,
      position: 'bottom',
      color,
      cssClass: 'diwali-toast',
      buttons: [
        {
          icon: 'close-outline',
          role: 'cancel'
        }
      ]
    });

    await toast.present();
  }

  // =====================================================
  // LOAD ADMIN PRODUCTS
  // =====================================================

  loadAdminProducts(): void {
    this.isLoadingProducts = true;
    this.productErrorMessage = '';

    this.productService.getAdminProducts().subscribe({
      next: (response) => {
        console.log('Admin Products API Response:', response);

        // The GET API returns { products: [...] }.
        this.products = response?.products ?? [];

        this.isLoadingProducts = false;

this.completeRefreshRequest();
        this.cdr.detectChanges();
      },

      error: (error) => {
        console.error('Admin Products API Error:', error);

        this.isLoadingProducts = false;

this.completeRefreshRequest();

        this.productErrorMessage =
          error?.error?.message ||
          error?.message ||
          'Unable to load products.';

        this.cdr.detectChanges();
      }
    });
  }

  // =====================================================
  // LOAD CATEGORIES
  // =====================================================

  private loadCategories(): void {
    this.productService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories ?? [];

this.completeRefreshRequest();
        this.cdr.detectChanges();
      },

      error: (error) => {
        console.error('Failed to load categories:', error);

this.completeRefreshRequest();
      }
    });
  }

  // =====================================================
  // SEARCH
  // =====================================================

  get filteredProducts(): AdminProduct[] {
    const search = this.searchText.trim().toLowerCase();

    if (!search) {
      return this.products;
    }

    return this.products.filter(product =>
      product.productName.toLowerCase().includes(search)
    );
  }

  // =====================================================
  // CATEGORY NAME
  // =====================================================

  getCategoryName(categoryId: number): string {
    const category = this.categories.find(
      item => item.categoryId === categoryId
    );

    return category?.categoryName ?? 'Unknown Category';
  }

  // =====================================================
  // NAVIGATION
  // =====================================================

  goBack(): void {
    this.router.navigate(['/tabs/adm-home']);
  }

  // =====================================================
  // OPEN ADD MODAL
  // =====================================================

  openAddProduct(): void {
    this.isEditMode = false;
    this.editingProductId = null;

    this.productName = '';
    this.productCategoryId = null;
    this.productStatus = 'ACTIVE';

    this.originalProductName = '';
    this.originalProductCategoryId = null;
    this.originalProductStatus = 'ACTIVE';

    this.selectedImages = [];
    this.existingImages = [];
    this.removedImageIds = [];
    this.newImagePreviews = [];
    this.imagePreviews = [];
    this.originalImageCount = 0;

    this.revokePreviewUrls();

    this.errorMessage = '';
    this.successMessage = '';

    this.isAddProductOpen = true;

    document.body.classList.add('adm-modal-open');

    this.cdr.detectChanges();
  }

  // =====================================================
  // OPEN EDIT MODAL
  // =====================================================

  openEditProduct(product: AdminProduct): void {
    this.isEditMode = true;
    this.editingProductId = product.productId;

    // Current product values.
    this.productName = product.productName;
    this.productCategoryId = product.categoryId;
    this.productStatus = product.status;

    // Original product values.
    this.originalProductName = product.productName;
    this.originalProductCategoryId = product.categoryId;
    this.originalProductStatus = product.status;

    // Reset image state.
    this.selectedImages = [];
    this.removedImageIds = [];

    this.revokePreviewUrls();

    this.newImagePreviews = [];

    // Preserve existing image objects so their IDs are available.
    this.existingImages = product.images?.length
      ? [...product.images]
      : [];

    this.originalImageCount = this.existingImages.length;

    // Convert image objects into URL strings for the previews.
    this.imagePreviews = this.existingImages.map(
      image => image.imageUrl
    );

    this.errorMessage = '';
    this.successMessage = '';

    this.isAddProductOpen = true;

    document.body.classList.add('adm-modal-open');

    this.cdr.detectChanges();
  }

  // =====================================================
  // CHECK WHETHER PRODUCT DATA CHANGED
  // =====================================================

  get hasProductDataChanged(): boolean {
    if (!this.isEditMode) {
      return true;
    }

    const currentName = this.productName.trim();
    const originalName = this.originalProductName.trim();

    const imagesChanged =
      this.removedImageIds.length > 0 ||
      this.selectedImages.length > 0 ||
      this.existingImages.length !== this.originalImageCount;

    return (
      currentName !== originalName ||
      this.productCategoryId !== this.originalProductCategoryId ||
      this.productStatus !== this.originalProductStatus ||
      imagesChanged
    );
  }

  // =====================================================
  // CLOSE MODAL
  // =====================================================

  closeAddProduct(): void {
    if (this.isAddingProduct) {
      return;
    }

    this.isAddProductOpen = false;
    this.isEditMode = false;
    this.editingProductId = null;

    this.productName = '';
    this.productCategoryId = null;
    this.productStatus = 'ACTIVE';

    this.originalProductName = '';
    this.originalProductCategoryId = null;
    this.originalProductStatus = 'ACTIVE';

    this.selectedImages = [];
    this.existingImages = [];
    this.removedImageIds = [];
    this.newImagePreviews = [];
    this.imagePreviews = [];
    this.originalImageCount = 0;

    this.revokePreviewUrls();

    this.errorMessage = '';
    this.successMessage = '';

    document.body.classList.remove('adm-modal-open');

    this.cdr.detectChanges();
  }

  // =====================================================
  // IMAGE SELECTION
  // =====================================================

  onImagesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) {
      return;
    }

    const files = Array.from(input.files);

    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        continue;
      }

      // Preserve existing images and append newly selected files.
      this.selectedImages.push(file);

      const previewUrl = URL.createObjectURL(file);

      this.objectUrls.push(previewUrl);
      this.newImagePreviews.push(previewUrl);
    }

    this.rebuildImagePreviews();

    // Allow the same file to be selected again.
    input.value = '';

    this.cdr.detectChanges();
  }

  // =====================================================
  // REMOVE IMAGE
  // =====================================================

  removeImage(index: number): void {
    if (index < 0 || index >= this.imagePreviews.length) {
      return;
    }

    const existingImageCount = this.existingImages.length;

    // Remove an existing backend image.
    if (index < existingImageCount) {
      const removedImage = this.existingImages[index];

      if (
        removedImage.productImageId != null &&
        !this.removedImageIds.includes(removedImage.productImageId)
      ) {
        this.removedImageIds.push(removedImage.productImageId);
      }

      this.existingImages.splice(index, 1);
    } else {
      // Remove a newly selected image.
      const newImageIndex = index - existingImageCount;

      if (
        newImageIndex < 0 ||
        newImageIndex >= this.selectedImages.length
      ) {
        return;
      }

      const previewUrl = this.newImagePreviews[newImageIndex];

      this.selectedImages.splice(newImageIndex, 1);
      this.newImagePreviews.splice(newImageIndex, 1);

      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);

        this.objectUrls = this.objectUrls.filter(
          url => url !== previewUrl
        );
      }
    }

    this.rebuildImagePreviews();

    this.cdr.detectChanges();

    console.log('Removed Image IDs:', this.removedImageIds);
    console.log('Remaining existing images:', this.existingImages);
    console.log('New image files:', this.selectedImages);
  }

  // =====================================================
  // REBUILD IMAGE PREVIEWS
  // =====================================================

  private rebuildImagePreviews(): void {
    this.imagePreviews = [
      ...this.existingImages.map(image => image.imageUrl),
      ...this.newImagePreviews
    ];
  }

  // =====================================================
  // REVOKE PREVIEW URLS
  // =====================================================

  private revokePreviewUrls(): void {
    this.objectUrls.forEach(url => URL.revokeObjectURL(url));

    this.objectUrls = [];
  }

  // =====================================================
  // ADD / UPDATE PRODUCT
  // =====================================================

  addProduct(): void {
    this.successMessage = '';
    this.errorMessage = '';

    const name = this.productName.trim();

    // Basic validation.
    if (!name) {
      this.errorMessage = 'Please enter product name.';
      void this.showToast(this.errorMessage, 'warning');
      return;
    }

    if (this.productCategoryId === null) {
      this.errorMessage = 'Please select a category.';
      void this.showToast(this.errorMessage, 'warning');
      return;
    }

    if (this.isEditMode && !this.productStatus) {
      this.errorMessage = 'Please select product status.';
      void this.showToast(this.errorMessage, 'warning');
      return;
    }

    // ===================================================
    // UPDATE PRODUCT
    // ===================================================

    if (this.isEditMode) {
      if (this.editingProductId === null) {
        this.errorMessage =
          'Unable to update product. Please try again later.';
        void this.showToast(this.errorMessage, 'danger');
        return;
      }

      if (!this.hasProductDataChanged) {
        return;
      }

      this.isAddingProduct = true;
      this.errorMessage = '';

      this.cdr.detectChanges();

      const productData = {
        productName: name,
        categoryId: this.productCategoryId,
        status: this.productStatus,
        removeImageIds: [...this.removedImageIds]
      };

      this.productService.updateAdminProduct(
        this.editingProductId,
        productData,
        this.selectedImages
      ).subscribe({
        next: async (response) => {
          console.log('Admin product updated:', response);

          this.isAddingProduct = false;

          if (response?.success === true) {
            await this.showToast(
              response?.message || 'Product updated successfully.',
              'success'
            );

            this.productService.clearAdminProductCache();

            this.closeAddProduct();
            this.loadAdminProducts();

            return;
          }

          this.errorMessage =
            response?.message ||
            'Unable to update product. Please try again later.';

          await this.showToast(this.errorMessage, 'danger');

          this.cdr.detectChanges();
        },

        error: async (error) => {
          console.error('Failed to update admin product:', error);

          this.isAddingProduct = false;

          this.errorMessage =
            this.getBackendMessage(error) ||
            'Unable to update product. Please try again later.';

          await this.showToast(this.errorMessage, 'danger');

          this.cdr.detectChanges();
        }
      });

      return;
    }

    // ===================================================
    // ADD PRODUCT
    // ===================================================

    if (this.selectedImages.length === 0) {
      this.errorMessage = 'Please select a product image.';
      void this.showToast(this.errorMessage, 'warning');
      return;
    }

    this.isAddingProduct = true;
    this.errorMessage = '';

    this.cdr.detectChanges();

    const productData = {
      productName: name,
      categoryId: this.productCategoryId,
      status: this.productStatus
    };

    this.productService.addAdminProduct(
      productData,
      this.selectedImages
    ).subscribe({
      next: async (response) => {
        console.log('Admin product added:', response);

        this.isAddingProduct = false;

        if (response?.success === false) {
          this.errorMessage =
            response?.message ||
            'Unable to add product. Please try again later.';

          await this.showToast(this.errorMessage, 'danger');

          this.cdr.detectChanges();
          return;
        }

        await this.showToast(
          response?.message || 'Product added successfully.',
          'success'
        );

        this.productService.clearAdminProductCache();

        this.closeAddProduct();
        this.loadAdminProducts();
      },

      error: async (error) => {
        console.error('Failed to add admin product:', error);

        this.isAddingProduct = false;

        this.errorMessage =
          this.getBackendMessage(error) ||
          'Unable to add product. Please try again later.';

        await this.showToast(this.errorMessage, 'danger');

        this.cdr.detectChanges();
      }
    });
  }

  // =====================================================
  // GO TO CATEGORIES
  // =====================================================

  goToCategories(): void {
    this.router.navigate(['/tabs/adm-categories']);
  }

  // =====================================================
  // BACKEND ERROR MESSAGE
  // =====================================================

  private getBackendMessage(error: unknown): string {
    const apiError = error as {
      error?: unknown;
      message?: string;
    };

    if (
      apiError.error &&
      typeof apiError.error === 'object'
    ) {
      const responseBody = apiError.error as {
        message?: unknown;
        error?: unknown;
        details?: unknown;
      };

      if (
        typeof responseBody.message === 'string' &&
        responseBody.message.trim()
      ) {
        return responseBody.message.trim();
      }

      if (
        typeof responseBody.error === 'string' &&
        responseBody.error.trim()
      ) {
        return responseBody.error.trim();
      }

      if (
        typeof responseBody.details === 'string' &&
        responseBody.details.trim()
      ) {
        return responseBody.details.trim();
      }
    }

    if (
      typeof apiError.error === 'string' &&
      apiError.error.trim()
    ) {
      return apiError.error.trim();
    }

    if (
      typeof apiError.message === 'string' &&
      apiError.message.trim()
    ) {
      return apiError.message.trim();
    }

    return '';
  }

  // =====================================================
  // LOGOUT
  // =====================================================

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

  confirmLogoutAction(): void {
    this.showLogoutConfirmation = false;
    this.logout();
  }

  // =====================================================
  // IMAGE PREVIEW ERROR
  // =====================================================

  onPreviewImageError(event: Event): void {
    const img = event.target as HTMLImageElement;

    // Avoid repeatedly handling the same failed image.
    img.onerror = null;

    const placeholder = document.createElement('div');

    placeholder.className =
      'flex h-full w-full flex-col items-center justify-center gap-1 bg-[#f7f3df] text-[#9b8b7c]';

    placeholder.innerHTML = `
      <span style="font-size:24px;line-height:1">▧</span>
      <span style="font-size:9px;font-weight:600">No image</span>
    `;

    img.replaceWith(placeholder);
  }
}