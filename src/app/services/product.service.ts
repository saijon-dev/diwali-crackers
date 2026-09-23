import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';


export interface ProductImage {
  productImageId: number;
  imageUrl: string;
}


export interface Product {
  productId: number;
  productStoreId: number;
  productCode: string;
  productName: string;
  categoryId: number;
  categoryName: string;
  brandName: string;
  description: string;
  isKidsSpecial: boolean;
  size: string;
  packQuantity: number;
  packUnit: string;
  mrp: number;
  sellingPrice: number;
  stockQuantity: number;
  isAvailable: boolean;
  storeName: string;
  storeAddress: string;
  city: string;
  state: string;
  pincode: string;
  contactNumber: string;
images: ProductImage[];
  badge: string | null;

  alreadyAdded: boolean;
}

export interface ProductPageResponse {
  content: Product[];
  empty: boolean;
  first: boolean;
  last: boolean;
  number: number;
  numberOfElements: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface ProductData {
  productName: string;
  categoryId: number;
  description: string;
  brandName: string;
  isKidsSpecial: Boolean;
  size: string;
  packQuantity: number;
  packUnit: string;
  mrp: number;
  sellingPrice: number;
  stockQuantity: number;
}

export interface Category {
  categoryId: number;
  categoryName: string;
  description: string;
  imageUrl?: string;
}

export interface CategoryData {
  categoryName: string;
  description: string;
}

export interface VendorProduct {
  productId: number;
  productStoreId: number;
  productCode: string;
  productName: string;

  categoryId: number;
  categoryName: string;

  brandName: string;
  description: string;
  isKidsSpecial: boolean;

  size: string;
  packQuantity: number;
  packUnit: string;

  mrp: number;
  sellingPrice: number;
  stockQuantity: number;
  isAvailable: boolean;

  storeName: string;
  storeImageUrl: string | null;
  storeAddress: string;
  city: string;
  state: string;
  pincode: string;
  contactNumber: string;

  images: ProductImage[];

  badge: string | null;
  alreadyAdded: boolean;
}

export interface VendorProductPage {
  content: VendorProduct[];

  empty: boolean;
  first: boolean;
  last: boolean;
  number: number;
  numberOfElements: number;
  size: number;
  totalElements: number;
  totalPages: number;

  pageable?: {
    offset: number;
    pageNumber: number;
    pageSize: number;
    paged: boolean;
    unpaged: boolean;
  };

  sort?: {
    empty: boolean;
    sorted: boolean;
    unsorted: boolean;
};
}


@Injectable({
  providedIn: 'root'
})
export class ProductService {

  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}



  getProducts(): Observable<ProductPageResponse> {

  return this.http.get<ProductPageResponse>(
    `${this.apiUrl}/products`
  );
}




searchProducts(
  search: string,
  page: number = 0,
  size: number = 10
): Observable<VendorProductPage> {

  let params = new HttpParams()
    .set('page', page)
    .set('size', size);

  if (search.trim()) {

    params = params.set(
      'search',
      search.trim()
    );

  }

  return this.http.get<VendorProductPage>(
    `${environment.apiUrl}/products`,
    {
      params
    }
  );

}
  /*
   * =========================
   * GET CATEGORIES
   * =========================
   */

  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(
      `${this.apiUrl}/categories`
    );
  }

  /*
   * =========================
   * ADD CATEGORY
   * =========================
   */

addCategory(
  categoryData: CategoryData,
  image: File
): Observable<any> {

  const formData = new FormData();

  const categoryBlob = new Blob(
    [JSON.stringify(categoryData)],
    {
      type: 'application/json'
    }
  );

  formData.append(
    'categoryData',
    categoryBlob
  );

  formData.append(
    'image',
    image,
    image.name
  );

  return this.http.post(
    `${this.apiUrl}/categories`,
    formData
  );
}



updateCategory(
  categoryId: number,
  categoryData: CategoryData,
  image: File
): Observable<any> {

  const formData = new FormData();

  const categoryDataBlob = new Blob(
    [JSON.stringify(categoryData)],
    {
      type: 'application/json'
    }
  );

  formData.append(
    'categoryData',
    categoryDataBlob
  );

  formData.append(
    'image',
    image,
    image.name
  );

  return this.http.put(
    `${this.apiUrl}/categories/${categoryId}`,
    formData
  );
}



getVendorProducts(): Observable<VendorProductPage> {
  return this.http.get<VendorProductPage>(
    `${environment.apiUrl}/vendor/products`
  );
}
  /*
   * =========================
   * ADD PRODUCT
   * =========================
   *
   * productData -> JSON part
   * images      -> multiple image files
   */

  addProduct(
    productData: ProductData,
    images: File[]
  ): Observable<any> {

    const formData = new FormData();

    const productBlob = new Blob(
      [JSON.stringify(productData)],
      {
        type: 'application/json'
      }
    );

    formData.append(
      'productData',
      productBlob
    );

    images.forEach((image) => {
      formData.append(
        'images',
        image,
        image.name
      );
    });

    return this.http.post(
      `${this.apiUrl}/vendor/products`,
      formData
    );
  }




updateVendorProduct(
  productId: number,
  productData: any,
  images: File[] = []
): Observable<any> {

  const formData = new FormData();


  /*
   * productData must be sent as application/json
   */

  const productDataBlob = new Blob(
    [
      JSON.stringify(productData)
    ],
    {
      type: 'application/json'
    }
  );


  formData.append(
    'productData',
    productDataBlob
  );


  /*
   * Add newly selected images.
   */

  images.forEach(image => {

    formData.append(
      'images',
      image,
      image.name
    );

  });


  return this.http.put(
    `${environment.apiUrl}/vendor/products/${productId}`,
    formData
  );

}




  // =====================================================
  // ADMIN PRODUCTS
  // =====================================================

  /**
   * Add a new Admin Product.
   *
   * POST:
   * /api/admin/products
   *
   * multipart/form-data:
   * productData
   * image
   */
  addAdminProduct(
    productData: {
      productName: string;
      categoryId: number;
      status: string;
    },
    image: File
  ): Observable<any> {

    const formData = new FormData();

    const productDataBlob = new Blob(
      [JSON.stringify(productData)],
      {
        type: 'application/json'
      }
    );

    formData.append(
      'productData',
      productDataBlob
    );

    formData.append(
      'image',
      image,
      image.name
    );

    return this.http.post(
      `${this.apiUrl}/admin/products`,
      formData
    );
  }

  /**
   * Update an existing Admin Product.
   *
   * PUT:
   * /api/admin/products/{productId}
   *
   * JSON:
   * {
   *   productName,
   *   categoryId,
   *   status
   * }
   */
  updateAdminProduct(
    productId: number,
    productData: {
      productName: string;
      categoryId: number;
      status: string;
    }
  ): Observable<any> {

    return this.http.put(
      `${this.apiUrl}/admin/products/${productId}`,
      productData
    );
  }


}