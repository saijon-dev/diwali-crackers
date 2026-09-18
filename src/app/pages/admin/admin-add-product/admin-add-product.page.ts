import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonIcon,
  IonBackButton
} from '@ionic/angular';

import { addIcons } from 'ionicons';

import {
  addOutline,
  imageOutline,
  closeOutline,
  cloudUploadOutline,
  chevronDownOutline
} from 'ionicons/icons';

import {
  ProductService,
  ProductData,
  Category
} from '../../../services/product.service';

@Component({
  selector: 'app-admin-add-product',
  standalone: true,
  templateUrl: './admin-add-product.page.html',
  styleUrls: ['./admin-add-product.page.scss'],
  imports: [
    IonContent,
    IonIcon,
    IonBackButton,
    FormsModule
  ]
})
export class AdminAddProductPage implements OnInit {

  /*
   * =========================
   * PRODUCT FIELDS
   * =========================
   */

  productName = '';

  categoryId: number | null = null;

  description = '';

  brandName = '';

  size = '';

  packQuantity: number | null = null;

  packUnit = 'BOX';

  mrp: number | null = null;

  sellingPrice: number | null = null;

  stockQuantity: number | null = null;


  /*
   * =========================
   * IMAGES
   * =========================
   */

  selectedImages: File[] = [];

  imagePreviews: string[] = [];


  /*
   * =========================
   * CATEGORIES
   * =========================
   */

  categories: Category[] = [];

  isLoadingCategories = false;

  categoryErrorMessage = '';


  /*
   * =========================
   * ADD CATEGORY POPUP
   * =========================
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
   * =========================
   * PRODUCT STATE
   * =========================
   */

  isLoading = false;

  successMessage = '';

  errorMessage = '';


  constructor(
    private productService: ProductService,
     private cdr: ChangeDetectorRef
  ) {

    addIcons({
      addOutline,
      imageOutline,
      closeOutline,
      cloudUploadOutline,
      chevronDownOutline
    });
  }


  ngOnInit(): void {

    this.loadCategories();

  }


  /*
   * =========================
   * LOAD CATEGORIES
   * =========================
   */
loadCategories(): void {

  this.isLoadingCategories = true;

  this.categoryErrorMessage = '';

  this.cdr.detectChanges();


  this.productService
    .getCategories()
    .subscribe({

      next: (categories) => {

        console.log(
          'Categories Loaded:',
          categories
        );

        this.categories =
          categories || [];

        this.isLoadingCategories = false;

        this.cdr.detectChanges();

      },

      error: (error) => {

        console.error(
          'Load Categories Error:',
          error
        );

        this.isLoadingCategories = false;

        this.categoryErrorMessage =
          error?.error?.message ||
          'Unable to load categories.';

        this.cdr.detectChanges();

      }

    });
}

  /*
   * =========================
   * OPEN CATEGORY BOX
   * =========================
   */

openCategoryBox(): void {

  this.showCategoryBox = true;

  this.newCategoryName = '';

  this.newCategoryDescription = '';

  this.newCategoryImage = null;

  this.newCategoryImagePreview = '';

  this.categorySuccessMessage = '';

  this.categoryAddErrorMessage = '';
}

  /*
   * =========================
   * CLOSE CATEGORY BOX
   * =========================
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
   * =========================
   * ADD CATEGORY
   * =========================
   */

addCategory(): void {

  this.categorySuccessMessage = '';
  this.categoryAddErrorMessage = '';

  /*
   * =========================
   * VALIDATION
   * =========================
   */

  if (!this.newCategoryName.trim()) {

    this.categoryAddErrorMessage =
      'Please enter category name.';

    this.cdr.detectChanges();

    return;
  }


  if (!this.newCategoryDescription.trim()) {

    this.categoryAddErrorMessage =
      'Please enter category description.';

    this.cdr.detectChanges();

    return;
  }


  if (!this.newCategoryImage) {

    this.categoryAddErrorMessage =
      'Please select a category image.';

    this.cdr.detectChanges();

    return;
  }


  /*
   * =========================
   * CATEGORY DATA
   * =========================
   */

  const categoryData = {

    categoryName:
      this.newCategoryName.trim(),

    description:
      this.newCategoryDescription.trim()

  };


  console.log(
    'Category Data:',
    categoryData
  );

  console.log(
    'Category Image:',
    this.newCategoryImage
  );


  /*
   * Show loading state
   */

  this.isAddingCategory = true;

  this.cdr.detectChanges();


  /*
   * =========================
   * POST CATEGORY
   * =========================
   */

  this.productService
    .addCategory(
      categoryData,
      this.newCategoryImage
    )
    .subscribe({

      next: (response) => {

        console.log(
          'Add Category Response:',
          response
        );


        /*
         * API has succeeded.
         *
         * Stop the Adding... state immediately.
         */

        this.isAddingCategory = false;

        this.categorySuccessMessage =
          response?.message ||
          'Category added successfully.';

        this.cdr.detectChanges();


        /*
         * =========================
         * RELOAD CATEGORIES
         * =========================
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
               * Replace category list
               */

              this.categories =
                categories || [];


              /*
               * Find newly created category
               */

              const createdCategory =
                this.categories.find(
                  category =>
                    category.categoryName
                      .trim()
                      .toLowerCase() ===
                    categoryData.categoryName
                      .trim()
                      .toLowerCase()
                );


              /*
               * Automatically select it
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
               * Clear category form
               */

              this.newCategoryName = '';

              this.newCategoryDescription = '';

              this.newCategoryImage = null;

              this.newCategoryImagePreview = '';


              /*
               * IMPORTANT
               *
               * Tell Angular to update the screen.
               */

              this.cdr.detectChanges();


              /*
               * Give the user a very short
               * success indication.
               */

              setTimeout(() => {

                this.showCategoryBox = false;

                this.categorySuccessMessage = '';

                this.cdr.detectChanges();

              }, 700);

            },


            error: (error) => {

              console.error(
                'Refresh Categories Error:',
                error
              );


              /*
               * The category POST succeeded.
               * Only refreshing the dropdown failed.
               */

              this.categorySuccessMessage =
                'Category added successfully.';

              this.isAddingCategory = false;

              this.cdr.detectChanges();

            }

          });

      },


      error: (error) => {

        console.error(
          'Add Category Error:',
          error
        );


        /*
         * IMPORTANT:
         * Always restore the button when API fails.
         */

        this.isAddingCategory = false;

        this.categoryAddErrorMessage =
          error?.error?.message ||
          error?.message ||
          'Unable to add category.';

        this.cdr.detectChanges();

      }

    });
}


onCategoryImageSelected(event: Event): void {

  const input =
    event.target as HTMLInputElement;

  if (
    !input.files ||
    input.files.length === 0
  ) {
    return;
  }

  const file = input.files[0];

  this.categoryAddErrorMessage = '';

  /*
   * Only allow images.
   */

  if (!file.type.startsWith('image/')) {

    this.categoryAddErrorMessage =
      'Please select a valid image file.';

    input.value = '';

    return;
  }


  this.newCategoryImage = file;


  /*
   * Preview
   */

  const reader = new FileReader();

  reader.onload = () => {

    if (typeof reader.result === 'string') {

      this.newCategoryImagePreview =
        reader.result;
    }

  };

  reader.readAsDataURL(file);


  /*
   * Allows selecting the same image again.
   */

  input.value = '';
}


  /*
   * =========================
   * IMAGE SELECTION
   * =========================
   */

  onImagesSelected(event: Event): void {

    const input =
      event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) {
      return;
    }

    const files = Array.from(input.files);

    this.errorMessage = '';

    files.forEach((file) => {

      if (!file.type.startsWith('image/')) {
        return;
      }

      this.selectedImages.push(file);

      const reader = new FileReader();

      reader.onload = () => {

        if (typeof reader.result === 'string') {

          this.imagePreviews.push(
            reader.result
          );
        }

      };

      reader.readAsDataURL(file);

    });

    /*
     * Allows selecting the same image again.
     */

    input.value = '';
  }


  /*
   * =========================
   * REMOVE IMAGE
   * =========================
   */

  removeImage(index: number): void {

    this.selectedImages.splice(
      index,
      1
    );

    this.imagePreviews.splice(
      index,
      1
    );
  }


  /*
   * =========================
   * ADD PRODUCT
   * =========================
   */

  addProduct(): void {

    this.successMessage = '';

    this.errorMessage = '';


    /*
     * PRODUCT NAME
     */

    if (!this.productName.trim()) {

      this.errorMessage =
        'Please enter product name.';

      return;
    }


    /*
     * CATEGORY
     */

    if (!this.categoryId) {

      this.errorMessage =
        'Please select a category.';

      return;
    }


    /*
     * DESCRIPTION
     */

    if (!this.description.trim()) {

      this.errorMessage =
        'Please enter product description.';

      return;
    }


    /*
     * BRAND
     */

    if (!this.brandName.trim()) {

      this.errorMessage =
        'Please enter brand name.';

      return;
    }


    /*
     * SIZE
     */

    if (!this.size.trim()) {

      this.errorMessage =
        'Please enter product size.';

      return;
    }


    /*
     * PACK QUANTITY
     */

    if (
      this.packQuantity === null ||
      this.packQuantity <= 0
    ) {

      this.errorMessage =
        'Please enter a valid pack quantity.';

      return;
    }


    /*
     * PACK UNIT
     */

    if (!this.packUnit.trim()) {

      this.errorMessage =
        'Please select pack unit.';

      return;
    }


    /*
     * MRP
     */

    if (
      this.mrp === null ||
      this.mrp < 0
    ) {

      this.errorMessage =
        'Please enter a valid MRP.';

      return;
    }


    /*
     * SELLING PRICE
     */

    if (
      this.sellingPrice === null ||
      this.sellingPrice < 0
    ) {

      this.errorMessage =
        'Please enter a valid selling price.';

      return;
    }


    /*
     * STOCK
     */

    if (
      this.stockQuantity === null ||
      this.stockQuantity < 0
    ) {

      this.errorMessage =
        'Please enter a valid stock quantity.';

      return;
    }


    /*
     * IMAGES
     */

    if (this.selectedImages.length === 0) {

      this.errorMessage =
        'Please select at least one product image.';

      return;
    }


    /*
     * =========================
     * PRODUCT REQUEST
     * =========================
     *
     * This now exactly follows
     * the backend request structure.
     */

    const productData: ProductData = {

      productName:
        this.productName.trim(),

      categoryId:
        Number(this.categoryId),

      description:
        this.description.trim(),

      brandName:
        this.brandName.trim(),

      size:
        this.size.trim(),

      packQuantity:
        Number(this.packQuantity),

      packUnit:
        this.packUnit.trim(),

      mrp:
        Number(this.mrp),

      sellingPrice:
        Number(this.sellingPrice),

      stockQuantity:
        Number(this.stockQuantity)
    };


    console.log(
      'Product Data:',
      productData
    );


    /*
     * =========================
     * API CALL
     * =========================
     */

    this.isLoading = true;

    this.productService
      .addProduct(
        productData,
        this.selectedImages
      )
      .subscribe({

        next: (response) => {

          this.isLoading = false;

          console.log(
            'Add Product Response:',
            response
          );


          if (response?.success === false) {

            this.errorMessage =
              response.message ||
              'Failed to add product.';

            return;
          }


          this.successMessage =
            response?.message ||
            'Product added successfully.';

          this.clearForm(false);
        },


        error: (error) => {

          this.isLoading = false;

          console.error(
            'Add Product Error:',
            error
          );

          this.errorMessage =
            error?.error?.message ||
            error?.message ||
            'Unable to add product. Please try again.';
        }

      });
  }


  /*
   * =========================
   * CLEAR FORM
   * =========================
   */

  clearForm(
    showMessage = true
  ): void {

    this.productName = '';

    this.categoryId = null;

    this.description = '';

    this.brandName = '';

    this.size = '';

    this.packQuantity = null;

    this.packUnit = 'BOX';

    this.mrp = null;

    this.sellingPrice = null;

    this.stockQuantity = null;

    this.selectedImages = [];

    this.imagePreviews = [];

    this.errorMessage = '';

    if (showMessage) {
      this.successMessage = '';
    }
  }

}