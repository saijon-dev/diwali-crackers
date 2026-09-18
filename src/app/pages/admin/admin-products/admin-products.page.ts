import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

import {
  IonContent,
  IonIcon,
    IonBackButton
} from '@ionic/angular';

import {
  addIcons
} from 'ionicons';

import {
  addOutline,
  menuOutline,
  searchOutline,
  chevronDownOutline,
  cubeOutline,
  ellipsisVerticalOutline
} from 'ionicons/icons';


interface AdminProduct {

  id: number;

  name: string;

  category: string;

  price: number;

  stock: number;

  image: string;

}


@Component({
  selector: 'app-admin-products',

  templateUrl: './admin-products.page.html',

  styleUrls: ['./admin-products.page.scss'],

  standalone: true,

  imports: [
    IonContent,
    IonIcon,
    FormsModule,
      IonBackButton
  ]
})
export class AdminProductsPage {



  menuOpen = false;

  /* =====================================
     SEARCH
     ===================================== */

  searchText = '';


  /* =====================================
     CATEGORY FILTER
     ===================================== */

  selectedCategory = 'all';


  /* =====================================
     CATEGORY LIST
     ===================================== */

  categories: string[] = [

    'all',

    'Sparklers',

    'Chakkers',

    'Flower Pots',

    'Rockets',

    'Sky Shots',

    'Gift Boxes',

    'Roman Candles',

    'Walas'

  ];


  /* =====================================
     PRODUCTS
     ===================================== */

  products: AdminProduct[] = [

    {
      id: 1,
      name: '12" Sparklers (10 pcs)',
      category: 'Sparklers',
      price: 150,
      stock: 100,
      image: 'assets/images/rectangle-image.png'
    },

    {
      id: 2,
      name: 'Colour Sky (5 pcs)',
      category: 'Sky Shots',
      price: 220,
      stock: 50,
      image: 'assets/images/rectangle-image.png'
    },

    {
      id: 3,
      name: 'Flower Pot (Big)',
      category: 'Flower Pots',
      price: 299,
      stock: 75,
      image: 'assets/images/rectangle-image.png'
    },

    {
      id: 4,
      name: 'Rocket Set (5 pcs)',
      category: 'Rockets',
      price: 180,
      stock: 60,
      image: 'assets/images/rectangle-image.png'
    },

    {
      id: 5,
      name: 'Sky Shots (12 shots)',
      category: 'Sky Shots',
      price: 450,
      stock: 20,
      image: 'assets/images/rectangle-image.png'
    },

    {
      id: 6,
      name: 'Gift Box (Combo)',
      category: 'Gift Boxes',
      price: 599,
      stock: 35,
      image: 'assets/images/rectangle-image.png'
    },

    {
      id: 7,
      name: 'Roman Candles (5 pcs)',
      category: 'Roman Candles',
      price: 250,
      stock: 40,
      image: 'assets/images/rectangle-image.png'
    },

    {
      id: 8,
      name: '100 Wala',
      category: 'Walas',
      price: 450,
      stock: 25,
      image: 'assets/images/rectangle-image.png'
    }

  ];


  constructor(
    private router: Router,
      private authService: AuthService
  ) {

    addIcons({

      addOutline,

      menuOutline,

      searchOutline,

      chevronDownOutline,

      cubeOutline,

      ellipsisVerticalOutline

    });

  }


  /* =====================================
     FILTERED PRODUCTS
     ===================================== */

  get filteredProducts(): AdminProduct[] {

    const search =
      this.searchText
        .trim()
        .toLowerCase();


    return this.products.filter(product => {

      const matchesSearch =
        product.name
          .toLowerCase()
          .includes(search);


      const matchesCategory =
        this.selectedCategory === 'all' ||
        product.category === this.selectedCategory;


      return matchesSearch && matchesCategory;

    });

  }


  /* =====================================
     ADD PRODUCT
     ===================================== */

  addProduct(): void {

    this.router.navigate([
      '/tabs/add-product'
    ]);

  }


  /* =====================================
     PRODUCT MENU
     ===================================== */

  openProductMenu(
    product: AdminProduct
  ): void {

    console.log(
      'Product Menu:',
      product
    );

  }


  /* =====================================
   SIDE MENU
   ===================================== */

toggleMenu(): void {

  this.menuOpen =
    !this.menuOpen;

}


closeMenu(): void {

  this.menuOpen = false;

}


/* =====================================
   LOGOUT
   ===================================== */

logout(): void {

  this.menuOpen = false;

  this.authService.logout();

  this.router.navigate([
    '/admin-login'
  ]);

}

}