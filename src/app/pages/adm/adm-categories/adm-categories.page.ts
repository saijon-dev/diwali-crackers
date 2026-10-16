import {
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit
} from '@angular/core';

import {
  IonContent,
  IonIcon,
  ToastController,
  IonRefresher,
  IonRefresherContent
} from '@ionic/angular';

import {
  FormsModule
} from '@angular/forms';

import {
  addIcons
} from 'ionicons';

import {
  arrowBackOutline,
  searchOutline,
  addOutline,
  closeOutline,
  cloudUploadOutline,
  trashOutline,
  gridOutline,
  refreshOutline
} from 'ionicons/icons';

import {
  Router
} from '@angular/router';

import {
  Category,
  CategoryData,
  ProductService
} from '../../../services/product.service';


@Component({
  selector: 'app-adm-categories',

  templateUrl: './adm-categories.page.html',



  standalone: true,

  imports: [
    IonContent,
    IonIcon,
    FormsModule,
    IonRefresher,
  IonRefresherContent
  ]
})


export class AdmCategoriesPage
  implements OnInit, OnDestroy {


  // =====================================================
  // ORIGINAL CATEGORY VALUES
  // =====================================================

  originalCategoryName = '';

  originalCategoryDescription = '';

  originalCategoryImageUrl = '';


  // =====================================================
  // CATEGORIES
  // =====================================================

  categories: Category[] = [];


  // =====================================================
  // CATEGORY LOADING
  // =====================================================

  isLoadingCategories = false;

  categoryLoadError = '';
  isVendor = false;


  // =====================================================
  // SEARCH
  // =====================================================

  searchText = '';


  // =====================================================
  // MODAL
  // =====================================================

  isCategoryModalOpen = false;

  isEditMode = false;

  editingCategoryId: number | null = null;

  isSaving = false;


  // =====================================================
  // BACKEND ERROR
  // =====================================================

  saveErrorMessage = '';


  // =====================================================
  // FORM
  // =====================================================

  categoryName = '';

  categoryDescription = '';


  // =====================================================
  // IMAGE
  // =====================================================

  selectedImage: File | null = null;

  imagePreview = '';

  private objectUrl: string | null = null;

  private activeRefresher: HTMLIonRefresherElement | null = null;


  // =====================================================
  // CONSTRUCTOR
  // =====================================================

  constructor(
    private router: Router,
    private cdr: ChangeDetectorRef,
    private productService: ProductService,
      private toastController: ToastController
  ) {

    addIcons({

      arrowBackOutline,

      searchOutline,

      addOutline,

      closeOutline,

      cloudUploadOutline,

      trashOutline,

      gridOutline,

      refreshOutline

    });

  }


  // =====================================================
  // INIT
  // =====================================================


  handleRefresh(event: CustomEvent): void {
  const refresher =
    event.target as HTMLIonRefresherElement;

  // Protect unsaved category form changes.
  if (this.isSaving || this.isCategoryModalOpen) {
    void refresher.complete();

    void this.showToast(
      this.isSaving
        ? 'Please wait until saving finishes.'
        : 'Close the category form before refreshing.'
    );

    return;
  }

  this.activeRefresher = refresher;

  // Ensure the refresh requests fresh category data.
  this.productService.clearCategoryCache();

  this.loadCategories();
}

private completeRefresh(): void {
  if (!this.activeRefresher) {
    return;
  }

  const refresher = this.activeRefresher;
  this.activeRefresher = null;

  void refresher.complete();
}

ngOnInit(): void {

  const role =
    localStorage
      .getItem('role')
      ?.trim()
      .toUpperCase();

  this.isVendor =
    role === 'VENDOR';

  this.loadCategories();

}


  // =====================================================
  // DESTROY
  // =====================================================

  ngOnDestroy(): void {

    this.revokeImagePreview();

    document.body.classList.remove(
      'adm-category-modal-open'
    );

  }


  // =====================================================
  // LOAD CATEGORIES
  // =====================================================

  loadCategories(): void {

    this.isLoadingCategories = true;

    this.categoryLoadError = '';

    this.cdr.detectChanges();


    this.productService
      .getCategories()
      .subscribe({

        next: (categories) => {

          this.categories =
            categories ?? [];

          this.isLoadingCategories = false;

          this.categoryLoadError = '';


this.completeRefresh();

          this.cdr.detectChanges();

        },


        error: (error) => {

          console.error(
            'Failed to load categories:',
            error
          );


          this.categories = [];

          this.isLoadingCategories = false;


          this.categoryLoadError =
            error?.error?.message ||
            error?.message ||
            'Unable to load categories. Please try again.';


this.completeRefresh();


          this.cdr.detectChanges();

        }

      });

  }


  // =====================================================
  // RETRY CATEGORIES
  // =====================================================

  retryLoadCategories(): void {

    if (this.isLoadingCategories) {
      return;
    }

    this.loadCategories();

  }


  // =====================================================
  // FILTERED CATEGORIES
  // =====================================================

  get filteredCategories(): Category[] {

    const search =
      this.searchText
        .trim()
        .toLowerCase();


    if (!search) {

      return this.categories;

    }


    return this.categories.filter(
      category =>
        category.categoryName
          .toLowerCase()
          .includes(search)
    );

  }


  // =====================================================
  // NAVIGATION
  // =====================================================

  goBack(): void {

    window.history.back();

  }


  // =====================================================
  // OPEN ADD CATEGORY
  // =====================================================

  openAddCategory(): void {

    this.isEditMode = false;

    this.editingCategoryId = null;


    this.categoryName = '';

    this.categoryDescription = '';


    this.selectedImage = null;

    this.imagePreview = '';

    this.saveErrorMessage = '';


    this.revokeImagePreview();


    this.isCategoryModalOpen = true;


    document.body.classList.add(
      'adm-category-modal-open'
    );


    this.cdr.detectChanges();

  }


  // =====================================================
  // OPEN EDIT CATEGORY
  // =====================================================

  openEditCategory(
    category: Category
  ): void {

    if (this.isVendor) {
    return;
  }

  this.isEditMode = true;

    this.editingCategoryId =
      category.categoryId;


    // ===================================================
    // CURRENT CATEGORY VALUES
    // ===================================================

    this.categoryName =
      category.categoryName;

    this.categoryDescription =
      category.description ?? '';


    // ===================================================
    // ORIGINAL VALUES
    // ===================================================

    this.originalCategoryName =
      category.categoryName;

    this.originalCategoryDescription =
      category.description ?? '';

    this.originalCategoryImageUrl =
      category.categoryImageUrl ?? '';


    // ===================================================
    // IMAGE
    // ===================================================

    this.selectedImage = null;

    this.revokeImagePreview();

    this.imagePreview =
      category.categoryImageUrl ?? '';


    this.saveErrorMessage = '';


    // ===================================================
    // OPEN MODAL
    // ===================================================

    this.isCategoryModalOpen = true;


    document.body.classList.add(
      'adm-category-modal-open'
    );


    this.cdr.detectChanges();

  }


  // =====================================================
  // HAS CATEGORY CHANGES
  // =====================================================

  hasCategoryChanges(): boolean {

    if (!this.isEditMode) {

      return (
        this.categoryName.trim().length > 0 &&
        this.selectedImage !== null
      );

    }


    const nameChanged =
      this.categoryName.trim() !==
      this.originalCategoryName.trim();


    const descriptionChanged =
      this.categoryDescription.trim() !==
      this.originalCategoryDescription.trim();


    const imageChanged =
      this.selectedImage !== null;


    return (
      nameChanged ||
      descriptionChanged ||
      imageChanged
    );

  }


  // =====================================================
  // CLOSE MODAL
  // =====================================================

  closeCategoryModal(): void {

    if (this.isSaving) {

      return;

    }


    this.isCategoryModalOpen = false;

    this.isEditMode = false;

    this.editingCategoryId = null;


    this.categoryName = '';

    this.categoryDescription = '';


    this.selectedImage = null;

    this.imagePreview = '';

    this.saveErrorMessage = '';


    this.revokeImagePreview();


    document.body.classList.remove(
      'adm-category-modal-open'
    );


    this.cdr.detectChanges();

  }


  // =====================================================
  // IMAGE SELECTION
  // =====================================================

  onImageSelected(
    event: Event
  ): void {

    const input =
      event.target as HTMLInputElement;


    if (
      !input.files ||
      input.files.length === 0
    ) {

      return;

    }


    const file =
      input.files[0];


    if (
      !file.type.startsWith('image/')
    ) {

      input.value = '';

      this.saveErrorMessage =
        'Please select a valid image file.';

      this.cdr.detectChanges();

      return;

    }


    this.selectedImage = file;


    this.revokeImagePreview();


    this.objectUrl =
      URL.createObjectURL(file);


    this.imagePreview =
      this.objectUrl;


    this.saveErrorMessage = '';


    input.value = '';


    this.cdr.detectChanges();

  }


  // =====================================================
  // REMOVE SELECTED IMAGE
  // =====================================================

  removeSelectedImage(): void {

    if (this.isEditMode) {

      this.selectedImage = null;

      this.revokeImagePreview();


      const category =
        this.categories.find(
          item =>
            item.categoryId ===
            this.editingCategoryId
        );


      this.imagePreview =
        category?.categoryImageUrl ?? '';


      this.saveErrorMessage = '';


      this.cdr.detectChanges();

      return;

    }


    this.selectedImage = null;

    this.imagePreview = '';

    this.revokeImagePreview();

    this.saveErrorMessage = '';

    this.cdr.detectChanges();

  }


  // =====================================================
  // REVOKE IMAGE PREVIEW
  // =====================================================

  private revokeImagePreview(): void {

    if (this.objectUrl) {

      URL.revokeObjectURL(
        this.objectUrl
      );

      this.objectUrl = null;

    }

  }


  // =====================================================
  // SAVE CATEGORY
  // =====================================================
saveCategory(): void {

  const name =
    this.categoryName.trim();

  const description =
    this.categoryDescription.trim();


  // ===================================================
  // BASIC VALIDATION
  // ===================================================

  if (!name) {

    this.saveErrorMessage =
      'Category name is required.';

    this.cdr.detectChanges();

    return;

  }


  // ===================================================
  // CLEAR OLD ERROR
  // ===================================================

  this.saveErrorMessage = '';


  // ===================================================
  // UPDATE CATEGORY
  // ===================================================

  if (this.isEditMode) {

    if (
      this.editingCategoryId === null
    ) {

      return;

    }


    /*
     * Image is OPTIONAL while updating.
     *
     * If the user selects a new image,
     * it will be uploaded.
     *
     * If the user does not select a new image,
     * the existing category image remains unchanged.
     */

    this.isSaving = true;

    this.cdr.detectChanges();


    const categoryData: CategoryData = {

      categoryName: name,

      description: description

    };


    this.productService
      .updateCategory(
        this.editingCategoryId,
        categoryData,
        this.selectedImage
      )
      .subscribe({

  next: (response) => {
  console.log('Category update successful:', response);

  this.isSaving = false;

  this.productService.clearCategoryCache();
  this.loadCategories();

  // Close the modal after a successful update.
  this.closeCategoryModal();

  // Show success feedback.
  void this.showToast(
    'Category updated successfully.',
    true
  );
},


error: (error) => {
  console.error('Failed to update category:', error);

  this.isSaving = false;

  this.saveErrorMessage =
    error?.error?.message ||
    'Unable to update category. Please try again later.';

  this.cdr.detectChanges();

  void this.showToast(
    'Unable to update category. Please try again later.'
  );
}

      });


    return;

  }


  // ===================================================
  // ADD CATEGORY
  // ===================================================

  if (!this.selectedImage) {

    this.saveErrorMessage =
      'Please select a category image.';

    this.cdr.detectChanges();

    return;

  }


  this.isSaving = true;

  this.cdr.detectChanges();


  const categoryData: CategoryData = {

    categoryName: name,

    description: description

  };


  this.productService
    .addCategory(
      categoryData,
      this.selectedImage
    )
    .subscribe({
next: (response) => {
  console.log('Category added successfully:', response);

  this.isSaving = false;

  this.productService.clearCategoryCache();
  this.loadCategories();

  // Close the modal after successful creation.
  this.closeCategoryModal();

  // Show success feedback.
  void this.showToast(
    'Category added successfully.',
    true
  );
},


     error: (error) => {
  console.error('Failed to add category:', error);

  this.isSaving = false;

  this.saveErrorMessage =
    error?.error?.message ||
    'Unable to add category. Please try again later.';

  this.cdr.detectChanges();

  void this.showToast(
    'Unable to add category. Please try again later.'
  );
}

    });

}


  // =====================================================
  // EXTRACT CREATED CATEGORY
  // =====================================================

  private extractCreatedCategory(
    response: any
  ): Category | null {

    /*
     * Support common backend response structures
     * without changing the API contract.
     */

    const category =
      response?.category ??
      response?.data ??
      response?.result ??
      response;


    if (
      !category ||
      typeof category !== 'object'
    ) {

      return null;

    }


    if (
      category.categoryId == null ||
      !category.categoryName
    ) {

      return null;

    }


    return category as Category;

  }



  private async showToast(
  message: string,
  isSuccess: boolean = false
): Promise<void> {
  const toast = await this.toastController.create({
    message,
    duration: 2500,
    position: 'bottom',
    cssClass: 'diwali-toast',
    color: isSuccess ? 'success' : 'danger'
  });

  await toast.present();
}

}