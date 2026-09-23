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
  imageOutline,
  cubeOutline
} from 'ionicons/icons';

import { Router } from '@angular/router';

import {
  Category,
  ProductService
} from '../../../services/product.service';


interface AdminProduct {

  id: number;

  productName: string;

  categoryId: number;

  status: 'ACTIVE' | 'INACTIVE';

  images: string[];

}


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
  // SEARCH
  // =====================================================

  searchText = '';


  // =====================================================
  // PRODUCT FORM
  // =====================================================

  productName = '';

  productCategoryId: number | null = null;

  productStatus: 'ACTIVE' | 'INACTIVE' = 'ACTIVE';


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
  // TEMPORARY PRODUCTS
  // =====================================================
  //
  // This will later be replaced with the Admin
  // GET Products API.
  //

  products: AdminProduct[] = [

    {
      id: 1,

      productName: 'Sparkler',

      categoryId: 1,

      status: 'ACTIVE',

      images: [
        'assets/images/rectangle-image.png'
      ]
    },

    {
      id: 2,

      productName: 'Flower Pot',

      categoryId: 2,

      status: 'ACTIVE',

      images: [
        'assets/images/rectangle-image.png'
      ]
    },

    {
      id: 3,

      productName: 'Ground Chakkar',

      categoryId: 3,

      status: 'ACTIVE',

      images: [
        'assets/images/rectangle-image.png'
      ]
    },

    {
      id: 4,

      productName: 'Rockets',

      categoryId: 4,

      status: 'ACTIVE',

      images: [
        'assets/images/rectangle-image.png'
      ]
    }

  ];


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

  }


  // =====================================================
  // DESTROY
  // =====================================================

  ngOnDestroy(): void {

    this.objectUrls.forEach(
      url => URL.revokeObjectURL(url)
    );

    document.body.classList.remove(
      'adm-modal-open'
    );

  }


  // =====================================================
  // LOAD CATEGORIES
  // =====================================================

  private loadCategories(): void {

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
      product.id;

    this.productName =
      product.productName;

    this.productCategoryId =
      product.categoryId;

    this.productStatus =
      product.status;

    this.selectedImages = [];

    this.revokePreviewUrls();

    /*
     * Existing image is displayed.
     *
     * The current PUT API does not provide
     * image update functionality, so we don't
     * send a new image during update.
     */
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


    /*
     * Admin Add Product API currently
     * accepts one image.
     */
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


      this.isAddingProduct = true;


      const productData = {

        productName: name,

        categoryId:
          this.productCategoryId,

        status:
          this.productStatus

      };


      this.productService
        .updateAdminProduct(
          this.editingProductId,
          productData
        )
        .subscribe({

          next: () => {

            const product =
              this.products.find(
                item =>
                  item.id ===
                  this.editingProductId
              );


            if (product) {

              product.productName =
                name;

              product.categoryId =
                this.productCategoryId!;

              product.status =
                this.productStatus;

            }


            this.isAddingProduct = false;

            this.closeAddProduct();

            this.cdr.detectChanges();

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


          /*
           * Temporary local update.
           *
           * Later, when the Admin GET Products
           * API is available, we will refresh
           * the product list from the backend.
           */
          const newProduct: AdminProduct = {

            id:
              response?.productId ??
              Date.now(),

            productName:
              name,

            categoryId:
              this.productCategoryId!,

            status:
              this.productStatus,

            images: [
              this.imagePreviews[0]
            ]

          };


          this.products.unshift(
            newProduct
          );


          this.isAddingProduct = false;

          this.closeAddProduct();

          this.cdr.detectChanges();

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
  this.router.navigate(['/tabs/adm-categories']);
}


}