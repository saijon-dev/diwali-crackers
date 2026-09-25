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

import { FormsModule } from '@angular/forms';

import { addIcons } from 'ionicons';

import {
  arrowBackOutline,
  searchOutline,
  addOutline,
  closeOutline,
  cloudUploadOutline,
  trashOutline,
  imageOutline,
  cubeOutline
} from 'ionicons/icons';

import { Router } from '@angular/router';

import {
  AdminProduct,
  Category,
  ProductService
} from '../../../services/product.service';


@Component({
  selector: 'app-adm-products',

  templateUrl: './adm-products.page.html',

  styleUrls: ['./adm-products.page.scss'],

  standalone: true,

  imports: [
    IonContent,
    IonIcon,
    FormsModule
  ]
})
export class AdmProductsPage
  implements OnInit, OnDestroy {


  // =====================================================
  // CATEGORIES
  // =====================================================

  categories: Category[] = [];


  // =====================================================
  // PRODUCTS
  // =====================================================

  products: AdminProduct[] = [];

  isLoadingProducts = false;

  productErrorMessage = '';


  // =====================================================
  // SEARCH
  // =====================================================

  searchText = '';


  // =====================================================
  // PRODUCT FORM
  // =====================================================

  productName = '';

  productCategoryId: number | null = null;

  productStatus:
    'ACTIVE' |
    'INACTIVE' = 'ACTIVE';


  // =====================================================
  // ORIGINAL PRODUCT VALUES
  // Used to detect changes during edit
  // =====================================================

  private originalProductName = '';

  private originalProductCategoryId:
    number | null = null;

  private originalProductStatus:
    'ACTIVE' |
    'INACTIVE' = 'ACTIVE';


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

  imagePreviews: string[] = [];

  private objectUrls: string[] = [];


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

      imageOutline,

      cubeOutline

    });

  }


  // =====================================================
  // INIT
  // =====================================================

  ngOnInit(): void {

    this.loadCategories();

    this.loadAdminProducts();

  }


  // =====================================================
  // DESTROY
  // =====================================================

  ngOnDestroy(): void {

    this.objectUrls.forEach(
      url =>
        URL.revokeObjectURL(url)
    );

    document.body.classList.remove(
      'adm-modal-open'
    );

  }


  // =====================================================
  // LOAD ADMIN PRODUCTS
  // =====================================================

  loadAdminProducts(): void {

    this.isLoadingProducts = true;

    this.productErrorMessage = '';

    this.productService
      .getAdminProducts()
      .subscribe({

        next: (response) => {

          console.log(
            'Admin Products API Response:',
            response
          );

          this.products =
            response?.products ?? [];

          this.isLoadingProducts = false;

          this.cdr.detectChanges();

        },


        error: (error) => {

          console.error(
            'Admin Products API Error:',
            error
          );

          this.products = [];

          this.isLoadingProducts = false;

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

    this.productService
      .getCategories()
      .subscribe({

        next: (categories) => {

          this.categories =
            categories ?? [];

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
  // SEARCH
  // =====================================================

  get filteredProducts(): AdminProduct[] {

    const search =
      this.searchText
        .trim()
        .toLowerCase();


    if (!search) {

      return this.products;

    }


    return this.products.filter(
      product =>
        product.productName
          .toLowerCase()
          .includes(search)
    );

  }


  // =====================================================
  // CATEGORY NAME
  // =====================================================

  getCategoryName(
    categoryId: number
  ): string {

    const category =
      this.categories.find(
        item =>
          item.categoryId === categoryId
      );


    return (
      category?.categoryName ??
      'Unknown Category'
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

    this.imagePreviews = [];


    this.revokePreviewUrls();


    this.isAddProductOpen = true;


    document.body.classList.add(
      'adm-modal-open'
    );


    this.cdr.detectChanges();

  }


  // =====================================================
  // OPEN EDIT MODAL
  // =====================================================

  openEditProduct(
    product: AdminProduct
  ): void {

    this.isEditMode = true;

    this.editingProductId =
      product.productId;


    // ================================================
    // CURRENT VALUES
    // ================================================

    this.productName =
      product.productName;

    this.productCategoryId =
      product.categoryId;

    this.productStatus =
      product.status;


    // ================================================
    // SAVE ORIGINAL VALUES
    // ================================================

    this.originalProductName =
      product.productName;

    this.originalProductCategoryId =
      product.categoryId;

    this.originalProductStatus =
      product.status;


    // ================================================
    // IMAGE STATE
    // ================================================

    this.selectedImages = [];

    this.revokePreviewUrls();


    this.imagePreviews =
      product.images?.length
        ? [...product.images]
        : [];


    this.isAddProductOpen = true;


    document.body.classList.add(
      'adm-modal-open'
    );


    this.cdr.detectChanges();

  }


  // =====================================================
  // CHECK WHETHER PRODUCT DATA CHANGED
  // =====================================================

  get hasProductDataChanged(): boolean {

    if (!this.isEditMode) {

      return true;

    }


    const currentName =
      this.productName.trim();


    const originalName =
      this.originalProductName.trim();


    return (

      currentName !== originalName ||

      this.productCategoryId !==
        this.originalProductCategoryId ||

      this.productStatus !==
        this.originalProductStatus ||

      this.selectedImages.length > 0

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

    this.imagePreviews = [];


    this.revokePreviewUrls();


    document.body.classList.remove(
      'adm-modal-open'
    );


    this.cdr.detectChanges();

  }


  // =====================================================
  // IMAGE SELECTION
  // =====================================================

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


    const file =
      input.files[0];


    if (
      !file.type.startsWith('image/')
    ) {

      input.value = '';

      return;

    }


    this.selectedImages = [
      file
    ];


    this.revokePreviewUrls();


    const url =
      URL.createObjectURL(file);


    this.objectUrls.push(url);


    this.imagePreviews = [
      url
    ];


    input.value = '';


    this.cdr.detectChanges();

  }


  // =====================================================
  // REMOVE IMAGE
  // =====================================================

  removeImage(
    index: number
  ): void {

    if (this.isEditMode) {

      return;

    }


    this.selectedImages.splice(
      index,
      1
    );


    this.revokePreviewUrls();


    this.imagePreviews =
      this.selectedImages.map(
        file => {

          const url =
            URL.createObjectURL(file);

          this.objectUrls.push(url);

          return url;

        }
      );


    this.cdr.detectChanges();

  }


  // =====================================================
  // REVOKE PREVIEW URLS
  // =====================================================

  private revokePreviewUrls(): void {

    this.objectUrls.forEach(
      url =>
        URL.revokeObjectURL(url)
    );

    this.objectUrls = [];

  }


  // =====================================================
  // ADD / UPDATE PRODUCT
  // =====================================================

  addProduct(): void {

    const name =
      this.productName.trim();


    // =================================================
    // BASIC VALIDATION
    // =================================================

    if (!name) {

      return;

    }


    if (
      this.productCategoryId === null
    ) {

      return;

    }


    if (!this.productStatus) {

      return;

    }


    // =================================================
    // UPDATE PRODUCT
    // =================================================

    if (this.isEditMode) {

      if (
        this.editingProductId === null
      ) {

        return;

      }


      /*
       * Do not send the request when
       * nothing has changed.
       */

      if (!this.hasProductDataChanged) {

        return;

      }


      this.isAddingProduct = true;


      const productData = {

        productName: name,

        categoryId:
          this.productCategoryId,

        status:
          this.productStatus

      };


      const selectedImage =
        this.selectedImages.length > 0
          ? this.selectedImages[0]
          : undefined;


      this.productService
        .updateAdminProduct(
          this.editingProductId,
          productData,
          selectedImage
        )
        .subscribe({

          next: (response) => {

            console.log(
              'Admin product updated:',
              response
            );


            this.isAddingProduct = false;


            this.closeAddProduct();


            /*
             * Reload from backend so the
             * screen always contains the
             * actual server data.
             */

            this.loadAdminProducts();

          },


          error: (error) => {

            console.error(
              'Failed to update admin product:',
              error
            );


            this.isAddingProduct = false;

            this.cdr.detectChanges();

          }

        });


      return;

    }


    // =================================================
    // ADD PRODUCT
    // =================================================

    if (
      this.selectedImages.length === 0
    ) {

      return;

    }


    this.isAddingProduct = true;


    const productData = {

      productName: name,

      categoryId:
        this.productCategoryId,

      status:
        this.productStatus

    };


    this.productService
      .addAdminProduct(
        productData,
        this.selectedImages[0]
      )
      .subscribe({

        next: (response) => {

          console.log(
            'Admin product added:',
            response
          );


          this.isAddingProduct = false;


          this.closeAddProduct();


          /*
           * Refresh the list from GET
           * instead of creating a temporary
           * frontend product.
           */

          this.loadAdminProducts();

        },


        error: (error) => {

          console.error(
            'Failed to add admin product:',
            error
          );


          this.isAddingProduct = false;

          this.cdr.detectChanges();

        }

      });

  }


  // =====================================================
  // GO TO CATEGORIES
  // =====================================================

  goToCategories(): void {

    this.router.navigate([
      '/tabs/adm-categories'
    ]);

  }

}