import {
  Component,
  OnInit,
  ChangeDetectorRef
} from '@angular/core';

import {
  IonContent,
  IonIcon
} from '@ionic/angular';

import { FormsModule } from '@angular/forms';

import {
  ActivatedRoute,
  Router
} from '@angular/router';

import { addIcons } from 'ionicons';

import {
  arrowBackOutline,
  imageOutline,
  saveOutline,
  closeOutline,
  addOutline,
  trashOutline
} from 'ionicons/icons';

import {
  ProductService,
  VendorProduct
} from '../../../services/product.service';


@Component({
  selector: 'app-admin-edit',
  templateUrl: './admin-edit.page.html',
  styleUrls: ['./admin-edit.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonIcon,
    FormsModule
  ]
})
export class AdminEditPage implements OnInit {

  productId!: number;

  product: VendorProduct | null = null;

  isLoading = true;

  errorMessage = '';

  isSaving = false;

  selectedImageIndex = 0;


  /*
   * Newly selected image files.
   *
   * Existing backend images are NOT stored here.
   * They remain inside product.images.
   */
  selectedImages: File[] = [];


  /*
   * Preview URLs for newly selected images.
   */
  newImagePreviews: string[] = [];


  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private cdr: ChangeDetectorRef
  ) {

    addIcons({
      arrowBackOutline,
      imageOutline,
      saveOutline,
      closeOutline,
      addOutline,
      trashOutline
    });

  }


  // =====================================================
  // INIT
  // =====================================================

  ngOnInit(): void {

    const id =
      this.route.snapshot.paramMap.get('id');


    if (!id) {

      this.errorMessage =
        'Product ID not found.';

      this.isLoading = false;

      this.cdr.detectChanges();

      return;
    }


    this.productId = Number(id);

    this.loadProduct();

  }


  // =====================================================
  // LOAD PRODUCT
  // =====================================================

  loadProduct(): void {

    this.isLoading = true;

    this.errorMessage = '';

    this.cdr.detectChanges();


    /*
     * TEMPORARY:
     *
     * Get all vendor products and find the
     * requested product.
     *
     * Later this can be replaced with:
     *
     * GET /api/vendor/products/{id}
     */

    this.productService
      .getVendorProducts()
      .subscribe({

        next: (response) => {

          console.log(
            'Vendor Products Response:',
            response
          );


          const products =
            response?.content ?? [];


          const selectedProduct =
            products.find(
              product =>
                Number(product.productId) ===
                this.productId
            );


          if (!selectedProduct) {

            this.product = null;

            this.errorMessage =
              'Product not found.';

            this.isLoading = false;

            this.cdr.detectChanges();

            return;
          }


          /*
           * Create a separate copy.
           *
           * IMPORTANT:
           * Existing images are preserved.
           *
           * The new API structure is:
           *
           * images: [
           *   {
           *     productImageId,
           *     imageUrl
           *   }
           * ]
           */

          this.product = {

            ...selectedProduct,

            images: [
              ...(selectedProduct.images ?? [])
            ]

          };


          this.selectedImageIndex = 0;

          this.selectedImages = [];

          this.newImagePreviews = [];

          this.isLoading = false;

          this.cdr.detectChanges();


          console.log(
            'Selected Product:',
            this.product
          );

        },


        error: (error) => {

          console.error(
            'Load Product Error:',
            error
          );


          this.product = null;

          this.isLoading = false;

          this.errorMessage =
            error?.error?.message ||
            error?.message ||
            'Unable to load product.';


          this.cdr.detectChanges();

        }

      });

  }


  // =====================================================
  // EXISTING IMAGE SELECTION
  // =====================================================

  selectImage(index: number): void {

    if (!this.product?.images?.length) {

      return;

    }


    if (
      index < 0 ||
      index >= this.product.images.length
    ) {

      return;

    }


    this.selectedImageIndex = index;

  }


  // =====================================================
  // PREVIOUS EXISTING IMAGE
  // =====================================================

  previousImage(): void {

    if (
      !this.product?.images?.length
    ) {

      return;

    }


    if (
      this.selectedImageIndex === 0
    ) {

      this.selectedImageIndex =
        this.product.images.length - 1;

    } else {

      this.selectedImageIndex--;

    }

  }


  // =====================================================
  // NEXT EXISTING IMAGE
  // =====================================================

  nextImage(): void {

    if (
      !this.product?.images?.length
    ) {

      return;

    }


    if (
      this.selectedImageIndex ===
      this.product.images.length - 1
    ) {

      this.selectedImageIndex = 0;

    } else {

      this.selectedImageIndex++;

    }

  }


  // =====================================================
  // GET EXISTING IMAGE URL
  // =====================================================

  getExistingImageUrl(): string {

    if (
      !this.product?.images?.length
    ) {

      return 'assets/images/rectangle-image.png';

    }


    return (
      this.product.images[
        this.selectedImageIndex
      ]?.imageUrl
      ||
      'assets/images/rectangle-image.png'
    );

  }


  // =====================================================
  // IMAGE UPLOAD
  // =====================================================

  onImageSelected(event: Event): void {

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


    /*
     * Only accept image files.
     */

    const imageFiles =
      files.filter(
        file =>
          file.type.startsWith('image/')
      );


    /*
     * Add newly selected files.
     *
     * Existing backend images are untouched.
     */

    this.selectedImages.push(
      ...imageFiles
    );


    /*
     * Generate previews for new images.
     */

    imageFiles.forEach(file => {

      const previewUrl =
        URL.createObjectURL(file);

      this.newImagePreviews.push(
        previewUrl
      );

    });


    /*
     * Reset file input.
     *
     * This allows the same file to be selected
     * again if necessary.
     */

    input.value = '';


    this.cdr.detectChanges();

  }


  // =====================================================
  // REMOVE NEW IMAGE
  // =====================================================

  removeNewImage(index: number): void {

    if (
      index < 0 ||
      index >= this.newImagePreviews.length
    ) {

      return;

    }


    /*
     * Release object URL.
     */

    const preview =
      this.newImagePreviews[index];


    if (preview) {

      URL.revokeObjectURL(preview);

    }


    /*
     * Remove preview.
     */

    this.newImagePreviews.splice(
      index,
      1
    );


    /*
     * Remove corresponding file.
     */

    this.selectedImages.splice(
      index,
      1
    );


    this.cdr.detectChanges();

  }


  // =====================================================
  // CLEAR NEW IMAGES
  // =====================================================

  clearNewImages(): void {

    this.newImagePreviews.forEach(
      preview =>
        URL.revokeObjectURL(preview)
    );


    this.newImagePreviews = [];

    this.selectedImages = [];


    this.cdr.detectChanges();

  }


  // =====================================================
  // UPDATE PRODUCT
  // =====================================================

  updateProduct(): void {

    if (!this.product) {

      return;

    }


    if (this.isSaving) {

      return;

    }


    this.isSaving = true;

    this.errorMessage = '';

    this.cdr.detectChanges();


    /*
     * Product information.
     *
     * Existing images are NOT included here.
     *
     * Existing backend images remain untouched.
     *
     * Newly selected images are sent separately
     * through the images[] FormData field.
     */

    const productData = {

      productName:
        this.product.productName,

      productCode:
        this.product.productCode,

      categoryId:
        this.product.categoryId,

      brandName:
        this.product.brandName,

      description:
        this.product.description,

      isKidsSpecial:
        this.product.isKidsSpecial,

      size:
        this.product.size,

      packQuantity:
        this.product.packQuantity,

      packUnit:
        this.product.packUnit,

      mrp:
        this.product.mrp,

      sellingPrice:
        this.product.sellingPrice,

      stockQuantity:
        this.product.stockQuantity,

      isAvailable:
        this.product.isAvailable,

      badge:
        this.product.badge,

      storeName:
        this.product.storeName,

      storeAddress:
        this.product.storeAddress,

      city:
        this.product.city,

      state:
        this.product.state,

      pincode:
        this.product.pincode,

      contactNumber:
        this.product.contactNumber

    };


    console.log(
      'PUT Product Data:',
      productData
    );


    console.log(
      'Existing Images:',
      this.product.images
    );


    console.log(
      'New Images:',
      this.selectedImages
    );


    /*
     * Send PUT request.
     *
     * Existing images are NOT removed.
     *
     * Only newly selected image files are sent.
     */

    this.productService
      .updateVendorProduct(
        this.productId,
        productData,
        this.selectedImages
      )
      .subscribe({

        next: (response) => {

          console.log(
            'Product Update Response:',
            response
          );


          this.isSaving = false;

          this.cdr.detectChanges();


          /*
           * Return to My Products.
           */

          this.router.navigate([
            '/tabs/vend-products'
          ]);

        },


        error: (error) => {

          console.error(
            'Update Product Error:',
            error
          );


          this.isSaving = false;


          this.errorMessage =
            error?.error?.message ||
            error?.message ||
            'Unable to update product.';


          this.cdr.detectChanges();

        }

      });

  }


  // =====================================================
  // BACK
  // =====================================================

  goBack(): void {

    this.router.navigate([
      '/tabs/vend-products'
    ]);

  }

}