import {
  Component,
  OnInit,
  ChangeDetectorRef
} from '@angular/core';

import { LocationService } from '../../services/location.service';

import { FormsModule } from '@angular/forms';

import {
  IonContent,
  IonSearchbar,
  IonIcon,
  IonButton
} from '@ionic/angular';

import {
  imageOutline
} from 'ionicons/icons';

import { addIcons } from 'ionicons';

import { Router } from '@angular/router';

import {
  ProductService,
  Product,
  Category
} from '../../services/product.service';


@Component({
  selector: 'app-home',

  templateUrl: './home.page.html',

  standalone: true,

  imports: [
    IonContent,
    IonSearchbar,
    IonIcon,
    FormsModule,
    IonButton
  ]
})
export class HomePage implements OnInit {


  /* =====================================
     SEARCH
     ===================================== */

  searchText = '';


  /* =====================================
     CATEGORIES
     ===================================== */

  categories: Category[] = [];

  isLoadingCategories = false;

  categoryErrorMessage = '';


  /* =====================================
     PRODUCTS FROM API
     ===================================== */

  products: Product[] = [];

  isLoadingProducts = false;

  productErrorMessage = '';


  constructor(
    private router: Router,
    private productService: ProductService,
    private cdr: ChangeDetectorRef,
    private locationService: LocationService
  ) {

    addIcons({
      imageOutline
    });

  }


async testLocation(): Promise<void> {

  alert('BUTTON CLICKED');

  console.log('BUTTON CLICKED');

  try {

    alert('Requesting location...');

    const location =
      await this.locationService.getCurrentLocation();

    console.log(
      'USER LOCATION:',
      location
    );

    alert(
      `Location received\n\nLatitude: ${location.latitude}\nLongitude: ${location.longitude}`
    );

  } catch (error) {

    console.error(
      'LOCATION ERROR:',
      error
    );

    alert(
      'Location Error:\n' +
      JSON.stringify(error)
    );

  }

}

  /* =====================================
     INITIAL LOAD
     ===================================== */

  ngOnInit(): void {

    this.loadCategories();

    this.loadProducts();

  }


  /* =====================================
     PAGE ENTER
     ===================================== */

  ionViewWillEnter(): void {

    this.loadCategories();

    this.loadProducts();

  }


  /* =====================================
     GET ALL CATEGORIES
     ===================================== */

  loadCategories(): void {

    this.isLoadingCategories = true;

    this.categoryErrorMessage = '';

    this.cdr.detectChanges();


    this.productService
      .getCategories()
      .subscribe({

        next: (response) => {

          console.log(
            'Categories API Response:',
            response
          );


          this.categories =
            response ?? [];


          console.log(
            'Categories Loaded:',
            this.categories
          );


          this.isLoadingCategories = false;

          this.cdr.detectChanges();

        },


        error: (error) => {

          console.error(
            'Categories API Error:',
            error
          );


          this.categories = [];

          this.isLoadingCategories = false;

          this.categoryErrorMessage =
            error?.error?.message ||
            error?.message ||
            'Unable to load categories.';


          this.cdr.detectChanges();

        }

      });

  }


  /* =====================================
     GET ALL PRODUCTS
     ===================================== */

  loadProducts(): void {

    this.isLoadingProducts = true;

    this.productErrorMessage = '';

    this.cdr.detectChanges();


    this.productService
      .getProducts()
      .subscribe({

        next: (response) => {

          console.log(
            'Products API Response:',
            response
          );


          /*
           * Backend response:
           *
           * {
           *   content: [...]
           * }
           */

          this.products =
            response?.content || [];


          console.log(
            'Products Loaded:',
            this.products
          );


          this.isLoadingProducts = false;

          this.cdr.detectChanges();

        },


        error: (error) => {

          console.error(
            'Products API Error:',
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


  /* =====================================
     ADMIN LOGIN
     ===================================== */

  goToAdminLogin(): void {

    this.router.navigate([
      '/admin-login'
    ]);

  }


  /* =====================================
     OPEN PRODUCT
     ===================================== */

  openProduct(
    product: Product
  ): void {

    /*
     * productStoreId identifies
     * the exact store-specific product.
     */

    this.router.navigate([
      '/tabs/product',
      product.productStoreId
    ]);

  }


  /* =====================================
     CATEGORY CLICK
     ===================================== */

selectCategory(categoryId: number): void {

  this.router.navigate(
    ['/tabs/categories'],
    {
      queryParams: {
        categoryId: categoryId
      }
    }
  );

}


  /* =====================================
     ADD TO CART
     ===================================== */

  addToCart(
    product: Product
  ): void {

    /*
     * Temporary frontend action.
     * Cart API will be connected later.
     */

    console.log(
      'Added to cart:',
      product
    );

  }


  /* =====================================
     OPEN ALL CATEGORIES
     ===================================== */

  openCategories(): void {

    this.router.navigate([
      '/tabs/categories'
    ]);

  }


  /* =====================================
     OPEN SEARCH
     ===================================== */

  openSearch(): void {

    this.router.navigate([
      '/tabs/search'
    ]);

  }

}