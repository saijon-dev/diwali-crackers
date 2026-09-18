import {
  Component,
  OnInit,
  ChangeDetectorRef
} from '@angular/core';

import { FormsModule } from '@angular/forms';

import {
  IonContent,
  IonSearchbar,
  IonIcon
} from '@ionic/angular';

import {
  menuOutline,
  closeOutline,
  imageOutline
} from 'ionicons/icons';

import { addIcons } from 'ionicons';

import { Router } from '@angular/router';

import {
  ProductService,
  Product
} from '../../services/product.service';


/* =====================================
   CATEGORY
   ===================================== */

interface Category {

  name: string;

  icon: string;

  background: string;

}


@Component({
  selector: 'app-home',

  templateUrl: './home.page.html',

  styleUrls: ['./home.page.scss'],

  standalone: true,

  imports: [
    IonContent,
    IonSearchbar,
    IonIcon,
    FormsModule
  ]
})
export class HomePage implements OnInit {


  /* =====================================
     SEARCH
     ===================================== */

  searchText = '';


  /* =====================================
     SIDE MENU
     ===================================== */

  menuOpen = false;


  /* =====================================
     CATEGORIES
     ===================================== */

  categories: Category[] = [

    {
      name: 'Sparklers',
      icon: '✨',
      background: '#f8d9ef'
    },

    {
      name: 'Chakkers',
      icon: '🔴',
      background: '#ffe0c7'
    },

    {
      name: 'Flower Pots',
      icon: '🎆',
      background: '#f8dec5'
    },

    {
      name: 'Rockets',
      icon: '🚀',
      background: '#ccecff'
    },

    {
      name: 'Gift Boxes',
      icon: '🎁',
      background: '#f7d9e8'
    },

    {
      name: 'Launchers',
      icon: '🚀',
      background: '#d7efda'
    },

    {
      name: 'Roman Candles',
      icon: '🧨',
      background: '#f5e2cc'
    },

    {
      name: 'Others',
      icon: '🎁',
      background: '#ffe8a8'
    }

  ];


  /* =====================================
     PRODUCTS FROM API
     ===================================== */

  products: Product[] = [];

  isLoadingProducts = false;

  productErrorMessage = '';


  constructor(
    private router: Router,
    private productService: ProductService,
    private cdr: ChangeDetectorRef
  ) {

    addIcons({
      menuOutline,
      closeOutline,
      imageOutline
    });

  }


  /* =====================================
     INITIAL LOAD
     ===================================== */

  ngOnInit(): void {

    this.loadProducts();

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
     OPEN / CLOSE MENU
     ===================================== */

  toggleMenu(): void {

    this.menuOpen =
      !this.menuOpen;

  }


  closeMenu(): void {

    this.menuOpen = false;

  }


  /* =====================================
     ADMIN LOGIN
     ===================================== */

  goToAdminLogin(): void {

    this.menuOpen = false;

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
     * IMPORTANT:
     *
     * productId can be the same for
     * multiple vendors.
     *
     * productStoreId identifies the
     * exact store-specific product.
     */

    this.router.navigate([
      '/tabs/product',
      product.productStoreId
    ]);

  }


  /* =====================================
     CATEGORY CLICK
     ===================================== */

  selectCategory(
    categoryName: string
  ): void {

    console.log(
      'Selected category:',
      categoryName
    );

  }


  /* =====================================
     ADD TO CART
     * Temporary frontend action.
     * Cart API will be connected later.
     ===================================== */

  addToCart(
    product: Product
  ): void {

    console.log(
      'Added to cart:',
      product
    );

  }

  openCategories(): void {

  this.router.navigate([
    '/tabs/categories'
  ]);

}

}