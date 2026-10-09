import {
  Component,
  OnInit,
  ChangeDetectorRef
} from '@angular/core';

import {
  IonContent,
  IonIcon,
  IonSelect,
  IonSelectOption,
  ToastController
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
  trashOutline,
  cameraOutline,
  checkmarkCircleOutline,
  alertCircleOutline
} from 'ionicons/icons';

import {
  ProductService,
  VendorProduct,
  LookupUnit
} from '../../../services/product.service';


// =====================================================
// EDIT IMAGE MODEL
// =====================================================

interface EditImage {

  type: 'existing' | 'new';

  url: string;

  file?: File;

  productImageId?: number;

}


// =====================================================
// COMPONENT
// =====================================================

@Component({
  selector: 'app-admin-edit',
  templateUrl: './admin-edit.page.html',
  standalone: true,
  imports: [
    IonContent,
    IonIcon,
    FormsModule,
    IonSelect,
    IonSelectOption
  ]
})


export class AdminEditPage implements OnInit {


  // =====================================================
  // PRODUCT
  // =====================================================

  productStoreId!: number;

  product: VendorProduct | null = null;


  // =====================================================
  // PAGE STATE
  // =====================================================

  isLoading = true;

  errorMessage = '';

  isSaving = false;


  // =====================================================
  // IMAGE STATE
  // =====================================================

  selectedImageIndex = 0;


  /*
   * IMPORTANT:
   *
   * This is now the SINGLE source of truth
   * for images on the edit screen.
   *
   * It contains BOTH:
   *
   * 1. Existing backend images
   * 2. Newly selected/captured images
   *
   * If an existing image is removed from this array,
   * it will NOT be included in the update.
   */

  editImages: EditImage[] = [];


  /*
   * Newly added files.
   *
   * This contains only actual File objects.
   */

  selectedImages: File[] = [];

  removedImageIds: number[] = [];


  /*
   * Kept for compatibility with the existing
   * page/template if referenced elsewhere.
   *
   * The actual combined UI now uses editImages.
   */

  newImagePreviews: string[] = [];


  // =====================================================
  // PACK UNITS
  // =====================================================

  packUnits: LookupUnit[] = [];

  isLoadingPackUnits = false;

  packUnitErrorMessage = '';


  // =====================================================
  // CONSTRUCTOR
  // =====================================================

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private cdr: ChangeDetectorRef,
    private toastController: ToastController
  ) {

    addIcons({

      arrowBackOutline,

      imageOutline,

      saveOutline,

      closeOutline,

      addOutline,

      trashOutline,

      cameraOutline,

      checkmarkCircleOutline,

      alertCircleOutline

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


    this.productStoreId =
      Number(id);


    /*
     * Pack units are independent of the product.
     *
     * This API can still be called.
     */

    this.loadPackUnits();


    /*
     * IMPORTANT:
     *
     * This does NOT call getVendorProducts().
     *
     * Product is obtained from router state.
     */

    this.loadProduct();

  }


  // =====================================================
  // LOAD PRODUCT FROM ROUTER STATE
  // =====================================================

  loadProduct(): void {

    this.isLoading = true;

    this.errorMessage = '';

    this.cdr.detectChanges();


    /*
     * Product was passed from vend-products page:
     *
     * this.router.navigate(
     *   ['/tabs/admin-edit', product.productId],
     *   {
     *     state: {
     *       product
     *     }
     *   }
     * );
     */

    const stateProduct =
      history.state?.product as
      VendorProduct | undefined;


    /*
     * Make sure the product in state matches
     * the URL product ID.
     */

    if (
      stateProduct &&
      Number(stateProduct.productStoreId) ===
        this.productStoreId
    ) {


      /*
       * Create a separate copy.
       */

      this.product = {

        ...stateProduct,

        images: [
          ...(stateProduct.images ?? [])
        ]

      };


      // =================================================
      // RESET IMAGE STATE
      // =================================================

      this.selectedImageIndex = 0;

      this.selectedImages = [];

      this.newImagePreviews = [];


      /*
       * IMPORTANT:
       *
       * Convert all existing backend images into
       * the combined editImages array.
       */

      this.editImages =
        (this.product.images ?? []).map(
          image => ({

            type: 'existing' as const,

            url: image.imageUrl,

            productImageId:
              image.productImageId

          })
        );


      this.errorMessage = '';

      this.isLoading = false;

      this.cdr.detectChanges();


      console.log(
        'Edit Product Loaded From Router State:',
        this.product
      );


      console.log(
        'Combined Edit Images:',
        this.editImages
      );


      return;

    }


    /*
     * We intentionally DO NOT call:
     *
     * this.productService.getVendorProducts()
     *
     * because that would download every vendor
     * product again.
     */

    this.product = null;

    this.editImages = [];

    this.errorMessage =
      'Product details are unavailable. Please open the product again from My Products.';

    this.isLoading = false;

    this.cdr.detectChanges();

  }


  // =====================================================
  // EXISTING IMAGE SELECTION
  // =====================================================

  selectImage(index: number): void {

    if (
      index < 0 ||
      index >= this.editImages.length
    ) {

      return;

    }


    this.selectedImageIndex =
      index;

  }


  // =====================================================
  // PREVIOUS IMAGE
  // =====================================================

  previousImage(): void {

    if (
      this.editImages.length === 0
    ) {

      return;

    }


    if (
      this.selectedImageIndex === 0
    ) {

      this.selectedImageIndex =
        this.editImages.length - 1;

    } else {

      this.selectedImageIndex--;

    }

  }


  // =====================================================
  // NEXT IMAGE
  // =====================================================

  nextImage(): void {

    if (
      this.editImages.length === 0
    ) {

      return;

    }


    if (
      this.selectedImageIndex ===
      this.editImages.length - 1
    ) {

      this.selectedImageIndex = 0;

    } else {

      this.selectedImageIndex++;

    }

  }


  // =====================================================
  // GET SELECTED IMAGE URL
  // =====================================================

  getExistingImageUrl(): string {

    if (
      this.editImages.length === 0
    ) {

      return 'assets/images/rectangle-image.png';

    }


    return (
      this.editImages[
        this.selectedImageIndex
      ]?.url ||
      'assets/images/rectangle-image.png'
    );

  }


  // =====================================================
  // ADD IMAGES FROM DEVICE
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
     * Add each new file to the combined
     * editImages array.
     */

    imageFiles.forEach(file => {

      const previewUrl =
        URL.createObjectURL(file);


      /*
       * Combined image list.
       */

      this.editImages.push({

        type: 'new',

        url: previewUrl,

        file

      });


      /*
       * Actual files sent during update.
       */

      this.selectedImages.push(
        file
      );


      /*
       * Keep preview array for compatibility.
       */

      this.newImagePreviews.push(
        previewUrl
      );

    });


    /*
     * Reset input so the same image can
     * be selected again.
     */

    input.value = '';


    this.cdr.detectChanges();


    console.log(
      'Combined Images After Upload:',
      this.editImages
    );

  }


  // =====================================================
  // REMOVE IMAGE FROM COMBINED LIST
  // =====================================================

  removeEditImage(index: number): void {

    if (
      index < 0 ||
      index >= this.editImages.length
    ) {

      return;

    }


    const image =
      this.editImages[index];


    /*
     * ===================================================
     * NEW IMAGE
     * ===================================================
     *
     * Remove the File because it should no longer
     * be sent to the backend.
     */

    if (
      image.type === 'new'
    ) {

      /*
       * Release object URL.
       */

      if (image.url) {

        URL.revokeObjectURL(
          image.url
        );

      }


      /*
       * Find the corresponding File.
       */

      if (image.file) {

        const fileIndex =
          this.selectedImages.findIndex(
            file =>
              file === image.file
          );


        if (fileIndex !== -1) {

          this.selectedImages.splice(
            fileIndex,
            1
          );

        }

      }


      /*
       * Remove from preview list.
       */

      const previewIndex =
        this.newImagePreviews.indexOf(
          image.url
        );


      if (previewIndex !== -1) {

        this.newImagePreviews.splice(
          previewIndex,
          1
        );

      }

    }


    /*
     * ===================================================
     * EXISTING IMAGE
     * ===================================================
     *
     * We DO NOT delete it from S3 here.
     *
     * We simply remove it from editImages.
     *
     * Therefore it will not be included in the
     * final update request.
     */



    /*
     * Keep selected image index valid.
     */
// =====================================================
// EXISTING IMAGE
// =====================================================

if (
  image.type === 'existing' &&
  image.productImageId != null
) {
  // Record the image ID for the backend.
  // Avoid adding the same ID more than once.
  if (!this.removedImageIds.includes(image.productImageId)) {
    this.removedImageIds.push(image.productImageId);
  }
}

// Remove from the preview list.
this.editImages.splice(index, 1);

// Keep selected image index valid.
if (this.editImages.length === 0) {
  this.selectedImageIndex = 0;
} else if (
  this.selectedImageIndex >= this.editImages.length
) {
  this.selectedImageIndex = this.editImages.length - 1;
}

this.cdr.detectChanges();

console.log('Removed Image IDs:', this.removedImageIds);
console.log('Combined Images After Remove:', this.editImages);
  }


  // =====================================================
  // REMOVE NEW IMAGE
  //
  // Kept for compatibility if old HTML calls it.
  // =====================================================

  removeNewImage(index: number): void {

    const newImages =
      this.editImages.filter(
        image =>
          image.type === 'new'
      );


    if (
      index < 0 ||
      index >= newImages.length
    ) {

      return;

    }


    const image =
      newImages[index];


    const combinedIndex =
      this.editImages.indexOf(
        image
      );


    if (
      combinedIndex !== -1
    ) {

      this.removeEditImage(
        combinedIndex
      );

    }

  }


  // =====================================================
  // REMOVE EXISTING IMAGE
  //
  // Kept for compatibility.
  // =====================================================

  removeExistingImage(
    index: number
  ): void {

    const existingImages =
      this.editImages.filter(
        image =>
          image.type === 'existing'
      );


    if (
      index < 0 ||
      index >= existingImages.length
    ) {

      return;

    }


    const image =
      existingImages[index];


    const combinedIndex =
      this.editImages.indexOf(
        image
      );


    if (
      combinedIndex !== -1
    ) {

      this.removeEditImage(
        combinedIndex
      );

    }

  }


  // =====================================================
  // CLEAR NEW IMAGES ONLY
  //
  // Existing images remain untouched.
  // =====================================================

  clearNewImages(): void {

    /*
     * Find new images from the combined array.
     */

    const newImages =
      this.editImages.filter(
        image =>
          image.type === 'new'
      );


    newImages.forEach(
      image => {

        if (image.url) {

          URL.revokeObjectURL(
            image.url
          );

        }

      }
    );


    /*
     * Remove all new images from
     * combined array.
     */

    this.editImages =
      this.editImages.filter(
        image =>
          image.type === 'existing'
      );


    /*
     * Clear newly selected files.
     */

    this.selectedImages = [];

    this.newImagePreviews = [];


    /*
     * Keep selected index valid.
     */

    if (
      this.selectedImageIndex >=
      this.editImages.length
    ) {

      this.selectedImageIndex =
        Math.max(
          0,
          this.editImages.length - 1
        );

    }


    this.cdr.detectChanges();

  }


  // =====================================================
  // CONVERT EXISTING IMAGE URL TO FILE
  // =====================================================




  // =====================================================
  // PREPARE ALL IMAGES FOR UPDATE
  // =====================================================




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


  // =====================================================
  // PRODUCT DATA
  // =====================================================

  const productData = {

    productName:
      this.product.productName,

    categoryId:
      Number(this.product.categoryId),

    description:
      this.product.description,

    brandName:
      this.product.brandName,

    isKidsSpecial:
      this.product.isKidsSpecial,

    size:
      this.product.size,

    packQuantity:
      Number(this.product.packQuantity),

    packUnit:
      this.product.packUnit,

    mrp:
      Number(this.product.mrp),

    sellingPrice:
      Number(this.product.sellingPrice),

    stockQuantity:
      Number(this.product.stockQuantity),

        removeImageIds: [...this.removedImageIds]

  };


  // =====================================================
  // EXISTING IMAGES TO KEEP
  // =====================================================

  const existingImageIds =
    this.editImages
      .filter(
        image =>
          image.type === 'existing' &&
          image.productImageId != null
      )
      .map(
        image =>
          image.productImageId!
      );


  // =====================================================
  // NEW IMAGES
  // =====================================================

  const newImages =
    this.editImages
      .filter(
        image =>
          image.type === 'new' &&
          image.file
      )
      .map(
        image =>
          image.file!
      );


  console.log(
    'PUT Product Data:',
    productData
  );

  console.log(
    'Existing Image IDs:',
    existingImageIds
  );

  console.log(
    'New Images:',
    newImages
  );


  // =====================================================
  // UPDATE PRODUCT
  // =====================================================

  this.productService
    .updateVendorProduct(
      this.productStoreId,
      productData,

      newImages
    )
  .subscribe({

  next: (response) => {
    console.log('Product Update Response:', response);

    this.isSaving = false;

    // Handle unsuccessful responses even when HTTP status is 200.
    if (response?.success === false) {
      this.errorMessage =
        response?.message?.toString().trim() ||
        'Unable to update product. Please try again.';

      this.cdr.detectChanges();

      void this.showToast(this.errorMessage);
      return;
    }

    // Update succeeded.
    const successMessage =
      response?.message?.toString().trim() ||
      'Product updated successfully.';

    this.cdr.detectChanges();

    // Navigate back to vendor products only on success.
    this.router.navigate(['/tabs/vend-products'], {
      state: {
        toastMessage: successMessage,
        toastType: 'success'
      }
    });
  },

  error: (error) => {
    console.error('Update Product Error:', error);

    this.isSaving = false;

    const responseBody = error?.error;
    let backendMessage = '';

    if (
      responseBody &&
      typeof responseBody === 'object'
    ) {
      if (
        typeof responseBody.message === 'string' &&
        responseBody.message.trim()
      ) {
        backendMessage = responseBody.message.trim();
      } else if (
        typeof responseBody.error === 'string' &&
        responseBody.error.trim()
      ) {
        backendMessage = responseBody.error.trim();
      } else if (
        typeof responseBody.details === 'string' &&
        responseBody.details.trim()
      ) {
        backendMessage = responseBody.details.trim();
      }
    } else if (
      typeof responseBody === 'string' &&
      responseBody.trim()
    ) {
      backendMessage = responseBody.trim();
    }

    this.errorMessage =
      backendMessage ||
      error?.message ||
      'Unable to update product. Please try again later.';

    this.cdr.detectChanges();

    void this.showToast(this.errorMessage);
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


  // =====================================================
  // LOAD PACK UNITS
  // =====================================================

  loadPackUnits(): void {

    this.isLoadingPackUnits = true;

    this.packUnitErrorMessage = '';

    this.cdr.detectChanges();


    this.productService
      .getPackUnits()
      .subscribe({

        next: (response) => {

          console.log(
            'Pack Units API Response:',
            response
          );


          this.packUnits =
            (response ?? []).filter(
              unit =>
                unit.status === 'ACTIVE'
            );


          this.isLoadingPackUnits = false;

          this.cdr.detectChanges();

        },


        error: (error) => {

          console.error(
            'Load Pack Units Error:',
            error
          );


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


  // =====================================================
  // TAKE PRODUCT PICTURE
  // =====================================================

  async takeProductPicture(): Promise<void> {

    this.errorMessage = '';


    const file =
      await this.productService.takePicture();


    /*
     * User cancelled camera.
     */

    if (!file) {

      return;

    }


    /*
     * Validate file.
     */

    if (
      !file.type.startsWith('image/')
    ) {

      this.errorMessage =
        'The captured file is not a valid image.';

      this.cdr.detectChanges();

      return;

    }


    /*
     * Create preview URL.
     */

    const previewUrl =
      URL.createObjectURL(file);


    /*
     * Add to combined image list.
     */

    this.editImages.push({

      type: 'new',

      url: previewUrl,

      file

    });


    /*
     * Add to actual files.
     */

    this.selectedImages.push(
      file
    );


    /*
     * Compatibility preview list.
     */

    this.newImagePreviews.push(
      previewUrl
    );


    this.cdr.detectChanges();


    console.log(
      'Combined Images After Camera:',
      this.editImages
    );

  }


  private async showToast(
  message: string,
  isSuccess: boolean = false
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