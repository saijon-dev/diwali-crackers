import {
  Component,
  OnInit,
  ChangeDetectorRef
} from '@angular/core';

import { FormsModule } from '@angular/forms';

import {
  IonContent,
  IonIcon,
  IonBackButton,
  IonSelect,
  IonSelectOption
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
  Category,
  AdminProduct
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
    FormsModule,
    IonSelect,
    IonSelectOption
  ]
})
export class AdminAddProductPage implements OnInit {


  /*
   * =========================
   * ADMIN PRODUCT
   * =========================
   */

  selectedAdminProduct: AdminProduct | null = null;

  isAdminProductSelected = false;

  existingProductImages: string[] = [];


  /*
   * =========================
   * PRODUCT FIELDS
   * =========================
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

    this.readSelectedAdminProduct();

    this.loadCategories();

  }


  /*
   * =========================
   * READ ADMIN PRODUCT
   * =========================
   *
   * The Admin Products page sends
   * the selected AdminProduct through
   * router state.
   */

  private readSelectedAdminProduct(): void {

    const navigation =
      window.history.state;

    const adminProduct =
      navigation?.adminProduct as
      AdminProduct | undefined;


    if (!adminProduct) {
      return;
    }


    this.selectedAdminProduct =
      adminProduct;

    this.isAdminProductSelected =
      true;


    /*
     * =========================
     * PREFILL ADMIN PRODUCT DATA
     * =========================
     */

    this.productName =
      adminProduct.productName || '';

    this.categoryId =
      adminProduct.categoryId ?? null;


    /*
     * Existing admin product images
     * are URLs, not File objects.
     */

    this.existingProductImages =
      adminProduct.images || [];


    /*
     * Do not automatically put
     * existing URL images into
     * selectedImages because
     * selectedImages contains File objects
     * required by FormData.
     */

    this.imagePreviews = [];

    this.cdr.detectChanges();

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

          this.isLoadingCategories =
            false;

          this.cdr.detectChanges();

        },


        error: (error) => {

          console.error(
            'Load Categories Error:',
            error
          );


          this.isLoadingCategories =
            false;

          this.categoryErrorMessage =
            error?.error?.message ||
            'Unable to load categories.';

          this.cdr.detectChanges();

        }

      });

  }


  /*
   * =========================
   * PRODUCT TYPE
   * =========================
   *
   * Kids Special = true
   * Regular      = false
   */

  selectProductType(
    value: boolean
  ): void {

    this.isKidsSpecial = value;

    this.cdr.detectChanges();

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


          this.isAddingCategory = false;

          this.categoryAddErrorMessage =
            error?.error?.message ||
            error?.message ||
            'Unable to add category.';

          this.cdr.detectChanges();

        }

      });

  }


  /*
   * =========================
   * CATEGORY IMAGE
   * =========================
   */

  onCategoryImageSelected(
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

    const reader =
      new FileReader();


    reader.onload = () => {

      if (
        typeof reader.result ===
        'string'
      ) {

        this.newCategoryImagePreview =
          reader.result;

      }

      this.cdr.detectChanges();

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

  onImagesSelected(
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


    const files =
      Array.from(input.files);


    this.errorMessage = '';


    files.forEach((file) => {

      /*
       * Only allow image files.
       */

      if (!file.type.startsWith('image/')) {

        return;

      }


      this.selectedImages.push(file);


      /*
       * Create preview.
       */

      const reader =
        new FileReader();


      reader.onload = () => {

        if (
          typeof reader.result ===
          'string'
        ) {

          this.imagePreviews.push(
            reader.result
          );

          this.cdr.detectChanges();

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

  removeImage(
    index: number
  ): void {

    this.selectedImages.splice(
      index,
      1
    );

    this.imagePreviews.splice(
      index,
      1
    );

    this.cdr.detectChanges();

  }


  /*
   * =========================
   * EXISTING ADMIN IMAGE
   * =========================
   */

  getExistingProductImage():
    string {

    if (
      this.existingProductImages.length >
      0
    ) {

      return this.existingProductImages[0];

    }

    return '';

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
     * =========================
     * PRODUCT NAME
     * =========================
     */

    if (!this.productName.trim()) {

      this.errorMessage =
        'Please enter product name.';

      return;

    }


    /*
     * =========================
     * CATEGORY
     * =========================
     */

    if (!this.categoryId) {

      this.errorMessage =
        'Please select a category.';

      return;

    }


    /*
     * =========================
     * DESCRIPTION
     * =========================
     */

    if (!this.description.trim()) {

      this.errorMessage =
        'Please enter product description.';

      return;

    }


    /*
     * =========================
     * BRAND
     * =========================
     */

    if (!this.brandName.trim()) {

      this.errorMessage =
        'Please enter brand name.';

      return;

    }


    /*
     * =========================
     * SIZE
     * =========================
     */

    if (!this.size.trim()) {

      this.errorMessage =
        'Please enter product size.';

      return;

    }


    /*
     * =========================
     * PACK QUANTITY
     * =========================
     */

    if (
      this.packQuantity === null ||
      !Number.isFinite(
        this.packQuantity
      ) ||
      this.packQuantity <= 0 ||
      !Number.isInteger(
        this.packQuantity
      )
    ) {

      this.errorMessage =
        'Please enter a valid pack quantity greater than 0.';

      return;

    }


    /*
     * =========================
     * PACK UNIT
     * =========================
     */

    if (!this.packUnit.trim()) {

      this.errorMessage =
        'Please select pack unit.';

      return;

    }


    /*
     * =========================
     * MRP
     * =========================
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
     * =========================
     * SELLING PRICE
     * =========================
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
     * =========================
     * STOCK
     * =========================
     */

    if (
      this.stockQuantity === null ||
      !Number.isFinite(
        this.stockQuantity
      ) ||
      this.stockQuantity <= 0 ||
      !Number.isInteger(
        this.stockQuantity
      )
    ) {

      this.errorMessage =
        'Please enter a valid stock quantity greater than 0.';

      return;

    }


    /*
     * =========================
     * IMAGES
     * =========================
     *
     * The new bulk API requires
     * actual File objects in the
     * "images" multipart field.
     *
     * Existing admin image URLs
     * cannot be sent as File objects.
     *
     * Therefore the vendor must
     * select at least one image.
     */

    if (this.selectedImages.length === 0) {

      this.errorMessage =
        'Please select at least one product image.';

      return;

    }


    /*
     * =========================
     * IMAGE INDEXES
     * =========================
     *
     * The indexes correspond to
     * the order of the images in
     * FormData.
     *
     * Example:
     *
     * selectedImages[0]
     * selectedImages[1]
     * selectedImages[2]
     *
     * becomes:
     *
     * imageIndexes: [0, 1, 2]
     */

    const imageIndexes =
      this.selectedImages.map(
        (_, index) => index
      );


    /*
     * =========================
     * PRODUCT REQUEST
     * =========================
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

      isKidsSpecial:
        this.isKidsSpecial,

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
        Number(this.stockQuantity),

      imageIndexes:
        imageIndexes

    };


    /*
     * =========================
     * DEBUG
     * =========================
     */

    console.log(
      'Product Data:',
      productData
    );

    console.log(
      'Selected Images:',
      this.selectedImages
    );

    console.log(
      'Image Indexes:',
      imageIndexes
    );


    /*
     * =========================
     * API CALL
     * =========================
     *
     * NEW API:
     *
     * POST
     * /api/vendor/products/bulk
     *
     * products -> JSON
     * images   -> File[]
     *
     * The service receives an array
     * because the backend now expects:
     *
     * {
     *   "products": [
     *      { ... }
     *   ]
     * }
     */

    this.isLoading = true;

    this.cdr.detectChanges();


    this.productService
      .addProduct(
        [productData],
        this.selectedImages
      )
      .subscribe({

        next: (response) => {

          this.isLoading = false;


          console.log(
            'Add Product Response:',
            response
          );


          if (
            response?.success === false
          ) {

            this.errorMessage =
              response.message ||
              'Failed to add product.';

            this.cdr.detectChanges();

            return;

          }


          this.successMessage =
            response?.message ||
            'Product added successfully.';


          /*
           * Clear uploaded File objects
           * and their previews.
           */

          this.selectedImages = [];

          this.imagePreviews = [];


          this.cdr.detectChanges();

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


          this.cdr.detectChanges();

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


    this.cdr.detectChanges();

  }

}