import {
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit
} from '@angular/core';

import {
  IonContent,
  IonIcon
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
  gridOutline
} from 'ionicons/icons';

import { Router } from '@angular/router';

import {
  Category,
  CategoryData,
  ProductService
} from '../../../services/product.service';


@Component({
  selector: 'app-adm-categories',

  templateUrl: './adm-categories.page.html',

  styleUrls: ['./adm-categories.page.scss'],

  standalone: true,

  imports: [
    IonContent,
    IonIcon,
    FormsModule
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


  // =====================================================
  // CONSTRUCTOR
  // =====================================================

  constructor(
    private router: Router,
    private cdr: ChangeDetectorRef,
    private productService: ProductService
  ) {

    addIcons({

      arrowBackOutline,
      searchOutline,
      addOutline,
      closeOutline,
      cloudUploadOutline,
      trashOutline,
      gridOutline

    });

  }


  // =====================================================
  // INIT
  // =====================================================

  ngOnInit(): void {

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

    this.productService
      .getCategories()
      .subscribe({

        next: (categories) => {

          this.categories = categories;

          this.cdr.detectChanges();

        },

        error: (error) => {

          console.error(
            'Failed to load categories:',
            error
          );

        }

      });

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

    this.router.navigate([
      '/tabs/adm-home'
    ]);

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
  // Used to detect whether user changed anything
  // ===================================================

  this.originalCategoryName =
    category.categoryName;

  this.originalCategoryDescription =
    category.description ?? '';

  this.originalCategoryImageUrl =
    category.imageUrl ?? '';


  // ===================================================
  // IMAGE
  // ===================================================

  this.selectedImage = null;

  this.revokeImagePreview();

  this.imagePreview =
    category.imageUrl ?? '';


  // ===================================================
  // OPEN MODAL
  // ===================================================

  this.isCategoryModalOpen = true;

  document.body.classList.add(
    'adm-category-modal-open'
  );

  this.cdr.detectChanges();

}



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

      return;

    }


    this.selectedImage = file;


    this.revokeImagePreview();


    this.objectUrl =
      URL.createObjectURL(file);


    this.imagePreview =
      this.objectUrl;


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
        category?.imageUrl ?? '';

      this.cdr.detectChanges();

      return;

    }


    this.selectedImage = null;

    this.imagePreview = '';

    this.revokeImagePreview();

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

      return;

    }


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
       * Current PUT API expects:
       *
       * categoryData
       * image
       */

      if (!this.selectedImage) {

        return;

      }


      this.isSaving = true;


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

          next: () => {

            this.isSaving = false;

            this.loadCategories();

            this.closeCategoryModal();

          },

          error: (error) => {

            console.error(
              'Failed to update category:',
              error
            );

            this.isSaving = false;

            this.cdr.detectChanges();

          }

        });


      return;

    }


    // ===================================================
    // ADD CATEGORY
    // ===================================================

    if (!this.selectedImage) {

      return;

    }


    this.isSaving = true;


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

        next: () => {

          this.isSaving = false;

          this.loadCategories();

          this.closeCategoryModal();

        },

        error: (error) => {

          console.error(
            'Failed to add category:',
            error
          );

          this.isSaving = false;

          this.cdr.detectChanges();

        }

      });

  }

}