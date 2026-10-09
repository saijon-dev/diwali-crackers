
import {
  Component,
  ChangeDetectorRef,
  OnInit
} from '@angular/core';

import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import {
  IonContent,
  IonIcon,
  IonBackButton,
  IonSelect,
  IonSelectOption,
  ToastController
} from '@ionic/angular';

import { addIcons } from 'ionicons';

import {
  addOutline,
  closeOutline,
  gridOutline,
  logOutOutline,
  menuOutline,
  searchOutline,
  imageOutline,
  cloudUploadOutline,
  chevronDownOutline,
  arrowBackOutline,
  cameraOutline,
  checkmarkCircleOutline,
  alertCircleOutline
} from 'ionicons/icons';

import {
  ProductService,
  ProductData,
  Category,
  AdminProductListItem,
    LookupUnit
} from '../../../services/product.service';

@Component({
  selector: 'app-admin-products',
  standalone: true,
  templateUrl: './admin-products.page.html',
  imports: [
    IonContent,
    IonIcon,
    IonBackButton,
    IonSelect,
    IonSelectOption,
    FormsModule
  ]
})
export class AdminProductsPage implements OnInit {

  /*
   * =====================================================
   * VIEW STATE
   * =====================================================
   */

  /*
 * =====================================================
 * PACK UNITS
 * =====================================================
 */

packUnits: LookupUnit[] = [];

isLoadingPackUnits = false;

packUnitErrorMessage = '';

  isAddProductView = false;

  showLogoutConfirmation = false;



  /*
   * =====================================================
   * PRODUCT LIST / SEARCH
   * =====================================================
   */

  searchText = '';

  isLoadingProducts = false;

  productsErrorMessage = '';

  adminProducts: AdminProductListItem[] = [];

  /*
   * =====================================================
   * SIDE MENU
   * =====================================================
   */

  isMenuOpen = false;

  /*
   * =====================================================
   * SELECTED CATALOGUE PRODUCT
   * =====================================================
   */

  selectedAdminProduct: AdminProductListItem | null = null;

  isAdminProductSelected = false;

  existingProductImages: string[] = [];

  /*
   * =====================================================
   * PRODUCT FIELDS
   * =====================================================
   */

  productName = '';

  categoryId: number | null = null;

  description = '';

  brandName = '';

  isKidsSpecial = false;

  size = '';

  packQuantity: number | null = null;

  packUnit = 'BOX';

  mrp: number | null = null;

  sellingPrice: number | null = null;

  stockQuantity: number | null = null;

  /*
   * =====================================================
   * PRODUCT IMAGES
   * =====================================================
   */

  selectedImages: File[] = [];

  imagePreviews: string[] = [];

  /*
   * =====================================================
   * CATEGORIES
   * =====================================================
   */

  categories: Category[] = [];

  isLoadingCategories = false;

  categoryErrorMessage = '';

  /*
   * =====================================================
   * ADD CATEGORY PANEL
   * =====================================================
   */

  showCategoryBox = false;

  newCategoryName = '';

  newCategoryDescription = '';

  newCategoryImage: File | null = null;

  newCategoryImagePreview = '';

  isAddingCategory = false;

  categorySuccessMessage = '';

  categoryAddErrorMessage = '';

  /*
   * =====================================================
   * ADD PRODUCT STATE
   * =====================================================
   */

  isLoading = false;

  successMessage = '';

  errorMessage = '';

  constructor(
    private router: Router,
    private productService: ProductService,
    private cdr: ChangeDetectorRef,
    private toastController: ToastController
  ) {
    addIcons({
      addOutline,
      closeOutline,
      gridOutline,
      logOutOutline,
      menuOutline,
      searchOutline,
      imageOutline,
      cloudUploadOutline,
      chevronDownOutline,
      arrowBackOutline,
      cameraOutline,
      checkmarkCircleOutline,
      alertCircleOutline
    });
  }

  ngOnInit(): void {
    this.loadAdminProducts();
    this.loadCategories();
      this.loadPackUnits();
  }

  /*
   * =====================================================
   * LOAD ADMIN PRODUCTS
   * =====================================================
   */

  loadAdminProducts(): void {
    this.isLoadingProducts = true;
    this.productsErrorMessage = '';

    this.cdr.detectChanges();

    this.productService.getAdminProductsV().subscribe({
      next: (response) => {
        console.log('Admin Products API response:', response);

        this.adminProducts = response?.content ?? [];
        this.isLoadingProducts = false;

        this.cdr.detectChanges();
      },

      error: (error) => {
        console.error('Admin Products API error:', error);

        this.adminProducts = [];

        this.productsErrorMessage =
          error?.error?.message ||
          error?.message ||
          'Unable to load products. Please try again.';

        this.isLoadingProducts = false;

        this.cdr.detectChanges();
      }
    });
  }

  /*
   * =====================================================
   * FILTER PRODUCTS
   * =====================================================
   */

  get filteredProducts(): AdminProductListItem[] {
    const search = this.searchText.trim().toLowerCase();

    if (!search) {
      return this.adminProducts;
    }

    return this.adminProducts.filter(product =>
      product.productName?.toLowerCase().includes(search) ||
      product.categoryName?.toLowerCase().includes(search) ||
      product.productCode?.toLowerCase().includes(search)
    );
  }

  onSearchChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchText = input.value;
  }

  clearSearch(): void {
    this.searchText = '';
  }

  getProductImage(product: AdminProductListItem): string {
    return product.imageUrl || 'assets/images/rectangle-image.png';
  }

  /*
   * =====================================================
   * OPEN EXISTING CATALOGUE PRODUCT
   * =====================================================
   *
   * Switches the current component to the form view.
   * No router navigation is required.
   */

  openProduct(product: AdminProductListItem): void {
    console.log('Selected Admin Product:', product);

    this.resetProductForm(false);

    this.selectedAdminProduct = product;
    this.isAdminProductSelected = true;

    this.productName = product.productName || '';
    this.categoryId = product.categoryId ?? null;

    this.existingProductImages = product.imageUrl
      ? [product.imageUrl]
      : [];

    this.imagePreviews = [];
    this.selectedImages = [];

    this.isAddProductView = true;
    this.closeMenu();

    this.cdr.detectChanges();
  }

  /*
   * =====================================================
   * OPEN FORM FOR A NEW PRODUCT
   * =====================================================
   */

  openNewProductForm(): void {
    this.resetProductForm(false);

    this.selectedAdminProduct = null;
    this.isAdminProductSelected = false;
    this.existingProductImages = [];

    this.isAddProductView = true;
    this.closeMenu();

    this.cdr.detectChanges();
  }

  /*
   * =====================================================
   * RETURN TO PRODUCT LIST
   * =====================================================
   */

  backToProducts(): void {
    this.isAddProductView = false;
    this.closeCategoryBox();

    this.cdr.detectChanges();
  }

  /*
   * =====================================================
   * LOAD CATEGORIES
   * =====================================================
   */

  loadCategories(): void {
    this.isLoadingCategories = true;
    this.categoryErrorMessage = '';

    this.cdr.detectChanges();

    this.productService.getCategories().subscribe({
      next: (categories) => {
        console.log('Categories Loaded:', categories);

        this.categories = categories || [];
        this.isLoadingCategories = false;

        this.cdr.detectChanges();
      },

      error: (error) => {
        console.error('Load Categories Error:', error);

        this.isLoadingCategories = false;

        this.categoryErrorMessage =
          error?.error?.message ||
          'Unable to load categories.';

        this.cdr.detectChanges();
      }
    });
  }

  /*
   * =====================================================
   * PRODUCT TYPE
   * =====================================================
   */

  selectProductType(value: boolean): void {
    this.isKidsSpecial = value;
    this.cdr.detectChanges();
  }

  /*
   * =====================================================
   * OPEN CATEGORY PANEL
   * =====================================================
   */

  openCategoryBox(): void {
    this.showCategoryBox = true;

    this.newCategoryName = '';
    this.newCategoryDescription = '';
    this.newCategoryImage = null;
    this.newCategoryImagePreview = '';

    this.categorySuccessMessage = '';
    this.categoryAddErrorMessage = '';

    this.cdr.detectChanges();
  }

  /*
   * =====================================================
   * CLOSE CATEGORY PANEL
   * =====================================================
   */

  closeCategoryBox(): void {
    if (this.isAddingCategory) {
      return;
    }

    this.showCategoryBox = false;

    this.newCategoryName = '';
    this.newCategoryDescription = '';
    this.newCategoryImage = null;
    this.newCategoryImagePreview = '';

    this.categorySuccessMessage = '';
    this.categoryAddErrorMessage = '';

    this.cdr.detectChanges();
  }

  /*
   * =====================================================
   * ADD CATEGORY
   * =====================================================
   */

addCategory(): void {
  this.categorySuccessMessage = '';
  this.categoryAddErrorMessage = '';

  if (!this.newCategoryName.trim()) {
    this.categoryAddErrorMessage = 'Please enter category name.';
    this.cdr.detectChanges();
    return;
  }

  if (!this.newCategoryDescription.trim()) {
    this.categoryAddErrorMessage = 'Please enter category description.';
    this.cdr.detectChanges();
    return;
  }

  if (!this.newCategoryImage) {
    this.categoryAddErrorMessage = 'Please select a category image.';
    this.cdr.detectChanges();
    return;
  }

  const categoryData = {
    categoryName: this.newCategoryName.trim(),
    description: this.newCategoryDescription.trim()
  };

  this.isAddingCategory = true;
  this.cdr.detectChanges();

  this.productService
    .addCategory(
      categoryData,
      this.newCategoryImage
    )
    .subscribe({
      next: (response) => {
        console.log('Add Category Response:', response);

        this.isAddingCategory = false;

        const backendMessage =
          response?.message?.toString().trim();

        if (response?.success === false) {
          this.categoryAddErrorMessage =
            backendMessage ||
            'Unable to add category. Please try again later.';

          this.cdr.detectChanges();
          return;
        }

        this.categorySuccessMessage =
          backendMessage ||
          'Category added successfully.';

        /*
         * ProductService.addCategory() already clears
         * the category cache after successful POST.
         */
        this.productService.clearCategoryCache();

        /*
         * Fetch the latest categories.
         */
        this.productService
          .getCategories()
          .subscribe({
            next: (categories) => {
              console.log(
                'Updated Categories:',
                categories
              );

              /*
               * Replace the dropdown data immediately.
               */
              this.categories = [...(categories ?? [])];

              /*
               * Find the newly created category.
               */
              const createdCategory =
                this.categories.find(
                  category =>
                    category.categoryName
                      ?.trim()
                      .toLowerCase() ===
                    categoryData.categoryName
                      .trim()
                      .toLowerCase()
                );

              /*
               * Automatically select the new category.
               */
              if (createdCategory) {
                this.categoryId =
                  createdCategory.categoryId;

                console.log(
                  'New Category Selected:',
                  createdCategory
                );
              }

              /*
               * Force Angular/Ionic to rebuild the
               * ion-select options.
               */
              this.cdr.detectChanges();

              /*
               * Clear add-category fields.
               */
              this.newCategoryName = '';
              this.newCategoryDescription = '';
              this.newCategoryImage = null;
              this.newCategoryImagePreview = '';

              /*
               * Close add-category panel.
               */
              setTimeout(() => {
                this.showCategoryBox = false;
                this.cdr.detectChanges();
              }, 700);
            },

            error: (error) => {
              console.error(
                'Refresh Categories Error:',
                error
              );

              this.categoryAddErrorMessage =
                error?.error?.message ||
                error?.message ||
                'Category was added, but the category list could not be refreshed. Please try again later.';

              this.cdr.detectChanges();
            }
          });
      },

      error: (error) => {
        console.error(
          'Add Category Error:',
          error
        );

        this.isAddingCategory = false;

        this.categoryAddErrorMessage =
          error?.error?.message ||
          error?.message ||
          'Unable to add category. Please try again later.';

        this.cdr.detectChanges();
      }
    });
}

  /*
   * =====================================================
   * CATEGORY IMAGE SELECTION
   * =====================================================
   */

  onCategoryImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];

    this.categoryAddErrorMessage = '';

    if (!file.type.startsWith('image/')) {
      this.categoryAddErrorMessage =
        'Please select a valid image file.';

      input.value = '';
      return;
    }

    this.newCategoryImage = file;

    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === 'string') {
        this.newCategoryImagePreview = reader.result;
      }

      this.cdr.detectChanges();
    };

    reader.readAsDataURL(file);

    input.value = '';
  }

  /*
   * =====================================================
   * PRODUCT IMAGE SELECTION
   * =====================================================
   */

  onImagesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) {
      return;
    }

    const files = Array.from(input.files);

    this.errorMessage = '';

    files.forEach(file => {
      if (!file.type.startsWith('image/')) {
        return;
      }

      this.selectedImages.push(file);

      const reader = new FileReader();

      reader.onload = () => {
        if (typeof reader.result === 'string') {
          this.imagePreviews.push(reader.result);
          this.cdr.detectChanges();
        }
      };

      reader.readAsDataURL(file);
    });

    input.value = '';
  }




  /* =====================================================
   TAKE PRODUCT PICTURE
===================================================== */

async takeProductPicture(): Promise<void> {

  /*
   * Clear any previous image error.
   */
  this.errorMessage = '';


  /*
   * Open the native camera through ProductService.
   */
  const file =
    await this.productService.takePicture();


  /*
   * User cancelled the camera or camera
   * did not return an image.
   */
  if (!file) {

    return;

  }


  /*
   * Make sure the returned file is an image.
   */
  if (!file.type.startsWith('image/')) {

    this.errorMessage =
      'The captured file is not a valid image.';

    this.cdr.detectChanges();

    return;

  }


  /*
   * Add the camera image to the SAME
   * selectedImages array used by
   * normal file selection.
   */
  this.selectedImages.push(
    file
  );


  /*
   * Create a preview for the captured image.
   *
   * This uses the exact same imagePreviews
   * array as the normal image picker.
   */
  const reader =
    new FileReader();


  reader.onload = () => {

    if (
      typeof reader.result === 'string'
    ) {

      this.imagePreviews.push(
        reader.result
      );

    }


    this.cdr.detectChanges();

  };


  reader.readAsDataURL(file);


  console.log(
    'Camera image added:',
    file
  );

}

  /*
   * =====================================================
   * REMOVE SELECTED IMAGE
   * =====================================================
   */

  removeImage(index: number): void {
    this.selectedImages.splice(index, 1);
    this.imagePreviews.splice(index, 1);

    this.cdr.detectChanges();
  }

  /*
   * =====================================================
   * EXISTING CATALOGUE IMAGE
   * =====================================================
   */

  getExistingProductImage(): string {
    if (this.existingProductImages.length > 0) {
      return this.existingProductImages[0];
    }

    return '';
  }

  /*
   * =====================================================
   * SUBMIT PRODUCT
   * =====================================================
   */

addProduct(): void {
  this.successMessage = '';
  this.errorMessage = '';

  if (this.isLoading) {
    return;
  }

  if (!this.productName.trim()) {
    this.errorMessage = 'Please enter product name.';
    void this.showToast(this.errorMessage);
    return;
  }

  if (!this.categoryId) {
    this.errorMessage = 'Please select a category.';
    void this.showToast(this.errorMessage);
    return;
  }

  if (!this.description.trim()) {
    this.errorMessage = 'Please enter product description.';
    void this.showToast(this.errorMessage);
    return;
  }

  if (!this.brandName.trim()) {
    this.errorMessage = 'Please enter brand name.';
    void this.showToast(this.errorMessage);
    return;
  }

  if (!this.size.trim()) {
    this.errorMessage = 'Please enter product size.';
    void this.showToast(this.errorMessage);
    return;
  }

  if (
    this.packQuantity === null ||
    !Number.isFinite(this.packQuantity) ||
    this.packQuantity <= 0 ||
    !Number.isInteger(this.packQuantity)
  ) {
    this.errorMessage =
      'Please enter a valid pack quantity greater than 0.';
    void this.showToast(this.errorMessage);
    return;
  }

  if (!this.packUnit?.trim()) {
    this.errorMessage = 'Please select pack unit.';
    void this.showToast(this.errorMessage);
    return;
  }

  if (
    this.mrp === null ||
    !Number.isFinite(this.mrp) ||
    this.mrp < 0
  ) {
    this.errorMessage = 'Please enter a valid MRP.';
    void this.showToast(this.errorMessage);
    return;
  }

  if (
    this.sellingPrice === null ||
    !Number.isFinite(this.sellingPrice) ||
    this.sellingPrice < 0
  ) {
    this.errorMessage = 'Please enter a valid selling price.';
    void this.showToast(this.errorMessage);
    return;
  }

  if (
    this.stockQuantity === null ||
    !Number.isFinite(this.stockQuantity) ||
    this.stockQuantity <= 0 ||
    !Number.isInteger(this.stockQuantity)
  ) {
    this.errorMessage =
      'Please enter a valid stock quantity greater than 0.';
    void this.showToast(this.errorMessage);
    return;
  }

  if (this.selectedImages.length === 0) {
    this.errorMessage =
      'Please select at least one product image.';
    void this.showToast(this.errorMessage);
    return;
  }

  const imageIndexes = this.selectedImages.map(
    (_, index) => index
  );

  const productData: ProductData = {
    productName: this.productName.trim(),
    categoryId: Number(this.categoryId),
    description: this.description.trim(),
    brandName: this.brandName.trim(),
    isKidsSpecial: this.isKidsSpecial,
    size: this.size.trim(),
    packQuantity: Number(this.packQuantity),
    packUnit: this.packUnit.trim(),
    mrp: Number(this.mrp),
    sellingPrice: Number(this.sellingPrice),
    stockQuantity: Number(this.stockQuantity),
    imageIndexes
  };

  console.log('Product Data:', productData);
  console.log('Selected Images:', this.selectedImages);
  console.log('Image Indexes:', imageIndexes);

  this.isLoading = true;
  this.cdr.detectChanges();

  this.productService
    .addProduct([productData], this.selectedImages)
    .subscribe({
      next: (response) => {
        console.log('Add Product Response:', response);

        this.isLoading = false;

        const backendMessage =
          response?.message?.toString().trim();

        if (
          response?.success === false ||
          response?.success === null
        ) {
          this.errorMessage =
            backendMessage ||
            'Unable to add product. Please try again later.';

          this.cdr.detectChanges();
          void this.showToast(this.errorMessage);
          return;
        }

        this.successMessage =
          backendMessage || 'Product added successfully.';

        this.selectedImages = [];
        this.imagePreviews = [];

        this.cdr.detectChanges();

        this.router.navigate(['/tabs/vend-products'], {
          state: {
            toastMessage: this.successMessage,
            toastType: 'success'
          }
        });
      },

      error: (error) => {
        console.error('Add Product Error:', error);

        this.isLoading = false;

        const body = error?.error;
        let backendMessage = '';

        if (body && typeof body === 'object') {
          backendMessage =
            body.message ||
            body.error ||
            body.details ||
            '';
        } else if (typeof body === 'string') {
          backendMessage = body;
        }

        this.errorMessage =
          (typeof backendMessage === 'string'
            ? backendMessage.trim()
            : '') ||
          error?.message ||
          'Unable to add product. Please try again later.';

        this.cdr.detectChanges();
        void this.showToast(this.errorMessage);
      }
    });
}

  /*
   * =====================================================
   * CLEAR PRODUCT FORM
   * =====================================================
   */

  clearForm(showMessage = true): void {
    this.resetProductForm(showMessage);
    this.cdr.detectChanges();
  }

  private resetProductForm(showMessage = true): void {
    this.productName = '';
    this.categoryId = null;
    this.description = '';
    this.brandName = '';
    this.isKidsSpecial = false;
    this.size = '';
    this.packQuantity = null;
    this.packUnit = 'BOX';
    this.mrp = null;
    this.sellingPrice = null;
    this.stockQuantity = null;

    this.selectedImages = [];
    this.imagePreviews = [];

    this.existingProductImages = [];
    this.selectedAdminProduct = null;
    this.isAdminProductSelected = false;

    this.errorMessage = '';

    if (showMessage) {
      this.successMessage = '';
    }

    this.closeCategoryBox();
  }




  /*
 * =====================================================
 * LOAD PACK UNITS
 * =====================================================
 */

loadPackUnits(): void {
  this.isLoadingPackUnits = true;
  this.packUnitErrorMessage = '';

  this.cdr.detectChanges();

  this.productService.getPackUnits().subscribe({
    next: (response) => {
      console.log('Pack Units API Response:', response);

      this.packUnits = (response ?? []).filter(
        unit => unit.status === 'ACTIVE'
      );

      /*
       * Keep BOX as the default when it exists
       * in the active lookup values.
       */
      const defaultUnit = this.packUnits.find(
        unit => unit.lookupCode === 'BOX'
      );

      if (defaultUnit && !this.packUnit) {
        this.packUnit = defaultUnit.lookupCode;
      }

      this.isLoadingPackUnits = false;
      this.cdr.detectChanges();
    },

    error: (error) => {
      console.error('Load Pack Units Error:', error);

      this.packUnits = [];

      this.packUnitErrorMessage =
        error?.error?.message ||
        error?.message ||
        'Unable to load pack units. Please try again.';

      this.isLoadingPackUnits = false;
      this.cdr.detectChanges();
    }
  });
}

  /*
   * =====================================================
   * SIDE MENU
   * =====================================================
   */

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  closeMenu(): void {
    this.isMenuOpen = false;
  }

  /*
   * =====================================================
   * LOGOUT
   * =====================================================
   */

  logout(): void {
    this.closeMenu();

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


private async showToast(
  message: string,
  isSuccess = false
): Promise<void> {
  const toast = await this.toastController.create({
    message,
    duration: 3000,
    position: 'middle',
    cssClass: 'diwali-toast',
    icon: isSuccess
      ? 'checkmark-circle-outline'
      : 'alert-circle-outline'
  });

  await toast.present();
}
}