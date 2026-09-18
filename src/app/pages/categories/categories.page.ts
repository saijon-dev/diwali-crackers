import {
  Component,
  OnInit,
  ChangeDetectorRef
} from '@angular/core';

import {
  IonContent,
  IonIcon,
  IonBackButton
} from '@ionic/angular';

import { addIcons } from 'ionicons';

import {
  chevronDownOutline,
  imageOutline,
  cartOutline
} from 'ionicons/icons';

import { Router } from '@angular/router';

import {
  ProductService,
  Product,
  Category
} from '../../services/product.service';

/* =====================================
   CATEGORY MODEL
   ===================================== */




/* =====================================
   CATEGORY WITH PRODUCTS
   ===================================== */

interface CategorySection {

  categoryId: number;

  categoryName: string;

  products: Product[];

}


@Component({
  selector: 'app-categories',

  templateUrl: './categories.page.html',

  styleUrls: ['./categories.page.scss'],

  standalone: true,

  imports: [
    IonContent,
    IonIcon,
    IonBackButton
  ]
})
export class CategoriesPage implements OnInit {


  /* =====================================
     CATEGORIES FROM API
     ===================================== */

  categories: Category[] = [];


  /* =====================================
     PRODUCTS FROM API
     ===================================== */

  products: Product[] = [];


  /* =====================================
     CATEGORY SECTIONS
     ===================================== */

  categorySections: CategorySection[] = [];


  /* =====================================
     SELECTED CATEGORY
     ===================================== */

  selectedCategoryId: number | null = null;


  /* =====================================
     LOADING
     ===================================== */

  isLoading = false;


  /* =====================================
     ERROR
     ===================================== */

  errorMessage = '';


  constructor(
    private productService: ProductService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {

    addIcons({

      chevronDownOutline,

      imageOutline,

      cartOutline

    });

  }


  /* =====================================
     INITIAL LOAD
     ===================================== */

  ngOnInit(): void {

    this.loadCategoriesAndProducts();

  }


  /* =====================================
     LOAD CATEGORIES + PRODUCTS
     ===================================== */

  loadCategoriesAndProducts(): void {

    this.isLoading = true;

    this.errorMessage = '';

    this.cdr.detectChanges();


    /*
     * First load categories.
     */

    this.productService
      .getCategories()
      .subscribe({

        next: (categories) => {

          console.log(
            'Categories API Response:',
            categories
          );


          this.categories =
            categories || [];


          /*
           * Then load products.
           */

          this.loadProducts();

        },


        error: (error) => {

          console.error(
            'Categories API Error:',
            error
          );


          this.isLoading = false;

          this.errorMessage =
            error?.error?.message ||
            error?.message ||
            'Unable to load categories.';


          this.cdr.detectChanges();

        }

      });

  }


  /* =====================================
     LOAD PRODUCTS
     ===================================== */

  loadProducts(): void {

    this.productService
      .getProducts()
      .subscribe({

        next: (response) => {

          console.log(
            'Products API Response:',
            response
          );


          this.products =
            response?.content || [];


          /*
           * Build category sections.
           */

          this.buildCategorySections();


          this.isLoading = false;

          this.cdr.detectChanges();

        },


        error: (error) => {

          console.error(
            'Products API Error:',
            error
          );


          this.products = [];

          this.categorySections = [];

          this.isLoading = false;

          this.errorMessage =
            error?.error?.message ||
            error?.message ||
            'Unable to load products.';


          this.cdr.detectChanges();

        }

      });

  }


  /* =====================================
     BUILD CATEGORY SECTIONS
     ===================================== */

  buildCategorySections(): void {

    /*
     * If a specific category is selected,
     * show only that category.
     */

    if (
      this.selectedCategoryId !== null
    ) {

      const selectedCategory =
        this.categories.find(
          category =>
            category.categoryId ===
            this.selectedCategoryId
        );


      if (!selectedCategory) {

        this.categorySections = [];

        return;

      }


      const categoryProducts =
        this.products.filter(
          product =>
            product.categoryId ===
            selectedCategory.categoryId
        );


      this.categorySections = [

        {
          categoryId:
            selectedCategory.categoryId,

          categoryName:
            selectedCategory.categoryName,

          products:
            categoryProducts

        }

      ];


      return;

    }


    /*
     * =================================
     * ALL CATEGORIES
     * =================================
     *
     * Create one section for every
     * category returned by the API.
     */

    this.categorySections =
      this.categories
        .map(category => {

          const categoryProducts =
            this.products.filter(
              product =>
                product.categoryId ===
                category.categoryId
            );


          return {

            categoryId:
              category.categoryId,

            categoryName:
              category.categoryName,

            products:
              categoryProducts

          };

        })
        /*
         * Don't show empty categories.
         *
         * If later the backend has a category
         * without products, it won't create
         * an empty section.
         */

        .filter(
          section =>
            section.products.length > 0
        );

  }


  /* =====================================
     CATEGORY FILTER
     ===================================== */

  selectCategory(
    categoryId: number | null
  ): void {

    this.selectedCategoryId =
      categoryId;


    this.buildCategorySections();

    this.cdr.detectChanges();

  }


  /* =====================================
     OPEN PRODUCT
     ===================================== */

  openProduct(
    product: Product
  ): void {

    /*
     * productId can repeat for different
     * stores.
     *
     * Therefore navigate using
     * productStoreId.
     */

    this.router.navigate([
      '/tabs/product',
      product.productStoreId
    ]);

  }


  /* =====================================
     ADD TO CART
     =====================================
     
     Cart API will be connected later.
     ===================================== */

  addToCart(
    product: Product
  ): void {

    console.log(
      'Added to cart:',
      product
    );

  }


  /* =====================================
     TRACK CATEGORY
     ===================================== */

  trackCategory(
    index: number,
    category: CategorySection
  ): number {

    return category.categoryId;

  }


  /* =====================================
     TRACK PRODUCT
     ===================================== */

  trackProduct(
    index: number,
    product: Product
  ): number {

    return product.productStoreId;

  }

}