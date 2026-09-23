import {
  Component,
  OnInit,
  ChangeDetectorRef
} from '@angular/core';

import {
  IonContent,
  IonIcon
} from '@ionic/angular';

import {
  FormsModule
} from '@angular/forms';

import {
  Router
} from '@angular/router';

import {
  addIcons
} from 'ionicons';

import {
  arrowBackOutline,
  searchOutline,
  closeOutline,
  imageOutline,
  trashOutline
} from 'ionicons/icons';

import {
  ProductService,
  VendorProduct
} from '../../services/product.service';


@Component({
  selector: 'app-search',
  templateUrl: './search.page.html',
  styleUrls: ['./search.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonIcon,
    FormsModule
  ]
})
export class SearchPage
  implements OnInit {


  /* ====================================================
     SEARCH
  ==================================================== */

  searchText = '';


  /* ====================================================
     RESULTS
  ==================================================== */

  searchResults: VendorProduct[] = [];


  /* ====================================================
     STATE
  ==================================================== */

  isSearching = false;

  hasSearched = false;

  errorMessage = '';


  /* ====================================================
     PAGINATION
  ==================================================== */

  currentPage = 0;

  pageSize = 10;

  totalResults = 0;


  /* ====================================================
     RECENT SEARCHES
  ==================================================== */

  recentSearches: string[] = [];


  /* ====================================================
     POPULAR SEARCHES
  ==================================================== */

  popularSearches: string[] = [

    'Sparklers',

    'Flower Pots',

    'Rockets',

    'Chakkars',

    'Gift Boxes',

    'Launchers'

  ];


  constructor(
    private productService: ProductService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {

    addIcons({

      arrowBackOutline,

      searchOutline,

      closeOutline,

      imageOutline,

      trashOutline

    });

  }


  /* ====================================================
     INIT
  ==================================================== */

  ngOnInit(): void {

    this.loadRecentSearches();

  }


  /* ====================================================
     LOAD RECENT SEARCHES
  ==================================================== */

  loadRecentSearches(): void {

    const stored =
      localStorage.getItem(
        'recentSearches'
      );


    if (!stored) {

      this.recentSearches = [];

      return;

    }


    try {

      const parsed =
        JSON.parse(stored);


      if (
        Array.isArray(parsed)
      ) {

        this.recentSearches =
          parsed;

      }

    } catch {

      this.recentSearches = [];

    }

  }


  /* ====================================================
     SAVE RECENT SEARCH
  ==================================================== */

  saveRecentSearch(
    search: string
  ): void {

    const value =
      search.trim();


    if (!value) {
      return;
    }


    /*
     * Remove duplicate.
     */

    this.recentSearches =
      this.recentSearches.filter(
        item =>
          item.toLowerCase() !==
          value.toLowerCase()
      );


    /*
     * Add latest search
     * to the beginning.
     */

    this.recentSearches.unshift(
      value
    );


    /*
     * Keep only latest 5.
     */

    this.recentSearches =
      this.recentSearches.slice(
        0,
        5
      );


    localStorage.setItem(
      'recentSearches',
      JSON.stringify(
        this.recentSearches
      )
    );

  }


  /* ====================================================
     SEARCH
  ==================================================== */

  searchProducts(
    searchValue?: string
  ): void {

    const value =
      (
        searchValue ??
        this.searchText
      ).trim();


    if (!value) {

      this.searchResults = [];

      this.hasSearched = false;

      this.errorMessage = '';

      return;

    }


    this.searchText = value;

    this.currentPage = 0;

    this.hasSearched = true;

    this.isSearching = true;

    this.errorMessage = '';


    /*
     * Save to recent searches.
     */

    this.saveRecentSearch(value);


    /*
     * Call backend.
     *
     * GET:
     *
     * /api/products
     * ?search=Flower
     * &page=0
     * &size=10
     */

    this.productService
      .searchProducts(
        value,
        this.currentPage,
        this.pageSize
      )
      .subscribe({

        next: (response) => {

          console.log(
            'Search Products Response:',
            response
          );


          this.searchResults =
            response?.content ?? [];


          this.totalResults =
            response?.totalElements ??
            this.searchResults.length;


          this.isSearching =
            false;


          this.cdr.detectChanges();

        },


        error: (error) => {

          console.error(
            'Search Products Error:',
            error
          );


          this.searchResults = [];

          this.totalResults = 0;

          this.isSearching =
            false;


          this.errorMessage =
            error?.error?.message ||
            'Unable to search products.';


          this.cdr.detectChanges();

        }

      });

  }


  /* ====================================================
     RECENT SEARCH CLICK
  ==================================================== */

  selectRecentSearch(
    search: string
  ): void {

    this.searchText = search;

    this.searchProducts(search);

  }


  /* ====================================================
     POPULAR SEARCH CLICK
  ==================================================== */

  selectPopularSearch(
    search: string
  ): void {

    this.searchText = search;

    this.searchProducts(search);

  }


  /* ====================================================
     CLEAR INPUT
  ==================================================== */

  clearSearch(): void {

    this.searchText = '';

    this.searchResults = [];

    this.hasSearched = false;

    this.totalResults = 0;

    this.errorMessage = '';

  }


  /* ====================================================
     REMOVE ONE RECENT SEARCH
  ==================================================== */

  removeRecentSearch(
    search: string,
    event: Event
  ): void {

    event.stopPropagation();


    this.recentSearches =
      this.recentSearches.filter(
        item =>
          item !== search
      );


    localStorage.setItem(
      'recentSearches',
      JSON.stringify(
        this.recentSearches
      )
    );

  }


  /* ====================================================
     CLEAR ALL RECENT SEARCHES
  ==================================================== */

  clearRecentSearches(): void {

    this.recentSearches = [];

    localStorage.removeItem(
      'recentSearches'
    );

  }


  /* ====================================================
     PRODUCT
  ==================================================== */

  openProduct(
    product: VendorProduct
  ): void {

    this.router.navigate(
      ['/tabs/product', product.productId]
    );

  }


  /* ====================================================
     ADD TO CART
     
     Temporary until Cart API is available.
  ==================================================== */

  addToCart(
    product: VendorProduct
  ): void {

    console.log(
      'Add to Cart:',
      product
    );

    /*
     * Later:
     *
     * this.cartService.addToCart(...)
     */

  }


  /* ====================================================
     BACK
  ==================================================== */

  goBack(): void {

    this.router.navigate([
      '/tabs/home'
    ]);

  }

}