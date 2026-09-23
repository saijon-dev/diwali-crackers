import { Component } from '@angular/core';
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


/* ====================================================
   PRODUCT IMAGE
==================================================== */

export interface AdminProductImage {
  productImageId: number;
  imageUrl: string;
}


/* ====================================================
   ADMIN PRODUCT
==================================================== */

export interface AdminProduct {
  productId: number;
  productName: string;
  categoryId: number;
  categoryName: string;
  images: AdminProductImage[];
}


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
export class AdminProductsPage {

  searchText = '';

  isMenuOpen = false;


  /* ====================================================
     TEMPORARY ADMIN PRODUCTS

     Later replace with:
     GET /api/admin/products
  ==================================================== */

  adminProducts: AdminProduct[] = [

    {
      productId: 1,
      productName: 'Flower Pot',
      categoryId: 1,
      categoryName: 'Flower Pots',
      images: [
        {
          productImageId: 1,
          imageUrl: 'assets/images/rectangle-image.png'
        }
      ]
    },

    {
      productId: 2,
      productName: 'Color Sparklers',
      categoryId: 2,
      categoryName: 'Sparklers',
      images: [
        {
          productImageId: 2,
          imageUrl: 'assets/images/rectangle-image.png'
        }
      ]
    },

    {
      productId: 3,
      productName: 'Rocket',
      categoryId: 3,
      categoryName: 'Rockets',
      images: [
        {
          productImageId: 3,
          imageUrl: 'assets/images/rectangle-image.png'
        }
      ]
    },

    {
      productId: 4,
      productName: 'Chakkar',
      categoryId: 4,
      categoryName: 'Chakkars',
      images: [
        {
          productImageId: 4,
          imageUrl: 'assets/images/rectangle-image.png'
        }
      ]
    },

    {
      productId: 5,
      productName: 'Atom Bomb',
      categoryId: 5,
      categoryName: 'Bombs',
      images: [
        {
          productImageId: 5,
          imageUrl: 'assets/images/rectangle-image.png'
        }
      ]
    },

    {
      productId: 6,
      productName: 'Color Fountain',
      categoryId: 6,
      categoryName: 'Fountains',
      images: [
        {
          productImageId: 6,
          imageUrl: 'assets/images/rectangle-image.png'
        }
      ]
    },

    {
      productId: 7,
      productName: 'Ground Spinner',
      categoryId: 7,
      categoryName: 'Ground Spinners',
      images: [
        {
          productImageId: 7,
          imageUrl: 'assets/images/rectangle-image.png'
        }
      ]
    },

    {
      productId: 8,
      productName: 'Mini Flower Pot',
      categoryId: 1,
      categoryName: 'Flower Pots',
      images: [
        {
          productImageId: 8,
          imageUrl: 'assets/images/rectangle-image.png'
        }
      ]
    },

    {
      productId: 9,
      productName: 'Electric Sparkler',
      categoryId: 2,
      categoryName: 'Sparklers',
      images: [
        {
          productImageId: 9,
          imageUrl: 'assets/images/rectangle-image.png'
        }
      ]
    },

    {
      productId: 10,
      productName: 'Big Rocket',
      categoryId: 3,
      categoryName: 'Rockets',
      images: [
        {
          productImageId: 10,
          imageUrl: 'assets/images/rectangle-image.png'
        }
      ]
    },

    {
      productId: 11,
      productName: 'Fancy Fountain',
      categoryId: 6,
      categoryName: 'Fountains',
      images: [
        {
          productImageId: 11,
          imageUrl: 'assets/images/rectangle-image.png'
        }
      ]
    },

    {
      productId: 12,
      productName: 'Wheel Chakkar',
      categoryId: 4,
      categoryName: 'Chakkars',
      images: [
        {
          productImageId: 12,
          imageUrl: 'assets/images/rectangle-image.png'
        }
      ]
    }

  ];


  constructor(
    private router: Router
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


  /* ====================================================
     FILTER
  ==================================================== */

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
          .toLowerCase()
          .includes(search)
        ||
        product.categoryName
          .toLowerCase()
          .includes(search)
    );
  }


  /* ====================================================
     SEARCH
  ==================================================== */

  onSearchChange(event: Event): void {

    const input =
      event.target as HTMLInputElement;

    this.searchText = input.value;

  }


  clearSearch(): void {

    this.searchText = '';

  }


  /* ====================================================
     GET PRODUCT IMAGE
  ==================================================== */

  getProductImage(product: AdminProduct): string {

    return (
      product.images?.[0]?.imageUrl
      ||
      'assets/images/rectangle-image.png'
    );

  }


  /* ====================================================
     EXISTING ADMIN PRODUCT
  ==================================================== */

  openProduct(product: AdminProduct): void {

    this.router.navigate(
      ['/tabs/add-product'],
      {
        state: {
          adminProduct: product
        }
      }
    );

  }


  /* ====================================================
     ADD FROM SCRATCH
  ==================================================== */

  addProduct(): void {

    this.router.navigate([
      '/tabs/add-product'
    ]);

  }


  /* ====================================================
     SIDE MENU
  ==================================================== */

  toggleMenu(): void {

    this.isMenuOpen =
      !this.isMenuOpen;

  }


  closeMenu(): void {

    this.isMenuOpen = false;

  }


  /* ====================================================
     LOGOUT
  ==================================================== */

  logout(): void {

    this.closeMenu();

    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('role');

    localStorage.removeItem('smartlearn_token');
    localStorage.removeItem('smartlearn_refresh_token');
    localStorage.removeItem('smartlearn_role');
    localStorage.removeItem('smartlearn_user_id');

    this.router.navigate([
      '/admin-login'
    ]);

  }

}