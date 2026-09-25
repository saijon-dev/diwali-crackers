import {
  Component,
  OnInit,
  ChangeDetectorRef
} from '@angular/core';

import { ActivatedRoute } from '@angular/router';

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
    private cdr: ChangeDetectorRef,
    private activatedRoute: ActivatedRoute
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

    /*
     * Read category ID passed from Home page.
     *
     * Example:
     *
     * /tabs/categories?categoryId=5
     *
     */

    this.activatedRoute.queryParamMap.subscribe(params => {

      const categoryId =
        params.get('categoryId');


      if (categoryId !== null) {

        const parsedCategoryId =
          Number(categoryId);


        if (
          Number.isInteger(parsedCategoryId) &&
          parsedCategoryId > 0
        ) {

          this.selectedCategoryId =
            parsedCategoryId;

        } else {

          this.selectedCategoryId = null;

        }

      } else {

        this.selectedCategoryId = null;

      }


      /*
       * Load the data after reading
       * the selected category.
       */

      this.loadCategoriesAndProducts();

    });

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
           * Build category sections
           * using the selected category ID.
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


    /*
     * Keep the URL synchronized
     * with the selected filter.
     */

    if (categoryId === null) {

      this.router.navigate(
        ['/tabs/categories'],
        {
          queryParams: {}
        }
      );

    } else {

      this.router.navigate(
        ['/tabs/categories'],
        {
          queryParams: {
            categoryId: categoryId
          }
        }
      );

    }


    this.buildCategorySections();

    this.cdr.detectChanges();

  }


  /* =====================================
     OPEN PRODUCT
     ===================================== */

  openProduct(
    product: Product
  ): void {

    this.router.navigate([
      '/tabs/product',
      product.productStoreId
    ]);

  }


  /* =====================================
     ADD TO CART
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