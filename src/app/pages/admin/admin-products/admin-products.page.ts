import {
  Component,
  OnInit
} from '@angular/core';

import { Router } from '@angular/router';

import {
  IonContent,
  IonIcon
} from '@ionic/angular';

import { addIcons } from 'ionicons';

import {
  addOutline,
  closeOutline,
  gridOutline,
  logOutOutline,
  menuOutline,
  searchOutline
} from 'ionicons/icons';

import {
  ProductService,
  AdminProduct
} from '../../../services/product.service';


@Component({
  selector: 'app-admin-products',
  templateUrl: './admin-products.page.html',
  styleUrls: ['./admin-products.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonIcon
  ]
})
export class AdminProductsPage
  implements OnInit {


  /*
   * =========================
   * SEARCH
   * =========================
   */

  searchText = '';


  /*
   * =========================
   * MENU
   * =========================
   */

  isMenuOpen = false;


  /*
   * =========================
   * API STATE
   * =========================
   */

  isLoading = false;

  errorMessage = '';


  /*
   * =========================
   * ADMIN PRODUCTS
   * =========================
   */

  adminProducts: AdminProduct[] = [];


  constructor(
    private router: Router,
    private productService: ProductService
  ) {

    addIcons({
      addOutline,
      closeOutline,
      gridOutline,
      logOutOutline,
      menuOutline,
      searchOutline
    });

  }


  ngOnInit(): void {

    this.loadAdminProducts();

  }


  /*
   * =========================
   * LOAD ADMIN PRODUCTS
   * =========================
   */

  loadAdminProducts(): void {

    this.isLoading = true;

    this.errorMessage = '';


    this.productService
      .getAdminProducts()
      .subscribe({

        next: (response) => {

          console.log(
            'Admin Products:',
            response
          );


          this.adminProducts =
            response?.products || [];


          this.isLoading = false;

        },


        error: (error) => {

          console.error(
            'Failed to load admin products:',
            error
          );


          this.adminProducts = [];

          this.errorMessage =
            error?.error?.message ||
            error?.message ||
            'Unable to load products. Please try again.';

          this.isLoading = false;

        }

      });

  }


  /*
   * =========================
   * FILTER PRODUCTS
   * =========================
   */

  get filteredProducts(): AdminProduct[] {

    const search =
      this.searchText
        .trim()
        .toLowerCase();


    if (!search) {

      return this.adminProducts;

    }


    return this.adminProducts.filter(
      product =>

        product.productName
          ?.toLowerCase()
          .includes(search)

        ||

        product.categoryName
          ?.toLowerCase()
          .includes(search)

        ||

        product.productCode
          ?.toLowerCase()
          .includes(search)

    );

  }


  /*
   * =========================
   * SEARCH CHANGE
   * =========================
   */

  onSearchChange(
    event: Event
  ): void {

    const input =
      event.target as HTMLInputElement;

    this.searchText =
      input.value;

  }


  /*
   * =========================
   * CLEAR SEARCH
   * =========================
   */

  clearSearch(): void {

    this.searchText = '';

  }


  /*
   * =========================
   * PRODUCT IMAGE
   * =========================
   */

  getProductImage(
    product: AdminProduct
  ): string {

    return (
      product.images?.[0] ||
      'assets/images/rectangle-image.png'
    );

  }


  /*
   * =========================
   * OPEN PRODUCT
   * =========================
   *
   * Send the complete AdminProduct
   * to Add Product page.
   */

  openProduct(
    product: AdminProduct
  ): void {

    console.log(
      'Selected Admin Product:',
      product
    );


    this.router.navigate(
      ['/tabs/add-product'],
      {
        state: {
          adminProduct: product
        }
      }
    );

  }


  /*
   * =========================
   * ADD NEW PRODUCT
   * =========================
   *
   * Opens Add Product without
   * an AdminProduct.
   */

  addProduct(): void {

    this.router.navigate(
      ['/tabs/add-product']
    );

  }


  /*
   * =========================
   * MENU
   * =========================
   */

  toggleMenu(): void {

    this.isMenuOpen =
      !this.isMenuOpen;

  }


  closeMenu(): void {

    this.isMenuOpen = false;

  }


  /*
   * =========================
   * LOGOUT
   * =========================
   */

  logout(): void {

    this.closeMenu();


    localStorage.removeItem(
      'accessToken'
    );

    localStorage.removeItem(
      'refreshToken'
    );

    localStorage.removeItem(
      'role'
    );

    localStorage.removeItem(
      'smartlearn_token'
    );

    localStorage.removeItem(
      'smartlearn_refresh_token'
    );

    localStorage.removeItem(
      'smartlearn_role'
    );

    localStorage.removeItem(
      'smartlearn_user_id'
    );


    this.router.navigate(
      ['/admin-login']
    );

  }

}