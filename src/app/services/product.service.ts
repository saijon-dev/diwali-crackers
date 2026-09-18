import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';


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
  imageUrls: string[];
  badge: string | null;
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
}