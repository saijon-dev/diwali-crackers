import { Injectable } from '@angular/core';

import {
  HttpClient,
  HttpParams
} from '@angular/common/http';

import {
  Observable,
  firstValueFrom
} from 'rxjs';

import { environment } from '../../environments/environment';

import {
  LocationService,
  UserLocation
} from './location.service';


/* =========================================================
   NEARBY STORE
========================================================= */

export interface NearbyStore {

  storeUserId: number;

  storeName: string;

  address: string;

  city: string;

  state: string;

  pincode: string;

  latitude: number;

  longitude: number;

  distanceKm: number;

  deliveryRadiusKm: number;

  deliversToCustomer: boolean;

}


/* =========================================================
   NEARBY STORE PAGE RESPONSE
========================================================= */

export interface NearbyStorePageResponse {

  content: NearbyStore[];

  empty: boolean;

  first: boolean;

  last: boolean;

  number: number;

  numberOfElements: number;

  size: number;

  totalElements: number;

  totalPages: number;

  pageable?: any;

  sort?: any;

}


/* =========================================================
   CUSTOMER LOCATION STATE
========================================================= */

export interface CustomerLocationState {

  latitude: number;

  longitude: number;

  accuracy: number;

  nearbyStores: NearbyStore[];

  nearbyStoreNames: string[];

}


/* =========================================================
   SERVICE
========================================================= */

@Injectable({
  providedIn: 'root'
})
export class LocationStateService {


  /* =======================================================
     STORAGE KEYS
  ======================================================= */

  private readonly LOCATION_KEY =
    'diwali_customer_location';

  private readonly NEARBY_STORES_KEY =
    'diwali_nearby_stores';


  /* =======================================================
     API
  ======================================================= */

  private readonly apiUrl =
    environment.apiUrl;


  /* =======================================================
     CURRENT STATE
  ======================================================= */

  private currentLocation: CustomerLocationState | null =
    null;


  constructor(
    private locationService: LocationService,
    private http: HttpClient
  ) {

    this.restoreStoredLocation();

  }


  /* =======================================================
     INITIALIZE CUSTOMER LOCATION
  ======================================================= */

  async initializeLocation(): Promise<CustomerLocationState> {

    /*
     * First try to use the location already stored
     * from an earlier successful initialization.
     */

    if (
      this.currentLocation &&
      this.currentLocation.nearbyStores.length >= 0
    ) {

      return this.currentLocation;

    }


    /*
     * Try restoring from localStorage.
     */

    this.restoreStoredLocation();


    if (
      this.currentLocation
    ) {

      return this.currentLocation;

    }


    /*
     * No stored location.
     *
     * Get the customer's current GPS location.
     */

    const location =
      await this.locationService.getCurrentLocation();


    /*
     * Call nearby stores API.
     */

    const nearbyStores =
      await this.getNearbyStores(
        location.latitude,
        location.longitude
      );


    /*
     * Only stores that actually deliver to the
     * customer are allowed.
     */

    const deliverableStores =
      nearbyStores.filter(
        store =>
          store.deliversToCustomer === true
      );


    /*
     * Store names are normalized so that:
     *
     * "Siri Crackers"
     *
     * and
     *
     * " siri crackers "
     *
     * are treated as the same store.
     */

    const nearbyStoreNames =
      deliverableStores.map(
        store =>
          this.normalizeStoreName(
            store.storeName
          )
      );


    /*
     * Create complete location state.
     */

    this.currentLocation = {

      latitude:
        location.latitude,

      longitude:
        location.longitude,

      accuracy:
        location.accuracy,

      nearbyStores:
        deliverableStores,

      nearbyStoreNames

    };


    /*
     * Save locally.
     */

    this.saveLocationState();


    console.log(
      'CUSTOMER LOCATION STATE:',
      this.currentLocation
    );


    return this.currentLocation;

  }


  /* =======================================================
     GET NEARBY STORES
  ======================================================= */

  getNearbyStores(
    latitude: number,
    longitude: number,
    page: number = 0,
    size: number = 10
  ): Promise<NearbyStore[]> {

    let params =
      new HttpParams()

        .set(
          'latitude',
          latitude
        )

        .set(
          'longitude',
          longitude
        )

        .set(
          'page',
          page
        )

        .set(
          'size',
          size
        );


    return firstValueFrom(

      this.http.get<NearbyStorePageResponse>(
        `${this.apiUrl}/stores/nearby`,
        {
          params
        }
      )

    ).then(

      response => {

        console.log(
          'Nearby Stores API Response:',
          response
        );


        return response?.content || [];

      }

    );

  }


  /* =======================================================
     GET CURRENT LOCATION STATE
  ======================================================= */

  getCurrentLocationState():
    CustomerLocationState | null {

    return this.currentLocation;

  }


  /* =======================================================
     GET NEARBY STORES
  ======================================================= */

  getNearbyStoresFromState():
    NearbyStore[] {

    return (
      this.currentLocation?.nearbyStores ||
      []
    );

  }


  /* =======================================================
     GET NEARBY STORE NAMES
  ======================================================= */

  getNearbyStoreNames():
    string[] {

    return (
      this.currentLocation?.nearbyStoreNames ||
      []
    );

  }


  /* =======================================================
     CHECK WHETHER STORE IS ALLOWED
  ======================================================= */

  isStoreNearby(
    storeName: string
  ): boolean {

    const normalizedStoreName =
      this.normalizeStoreName(
        storeName
      );


    return this.getNearbyStoreNames()
      .includes(
        normalizedStoreName
      );

  }


  /* =======================================================
     FILTER PRODUCTS BY STORE NAME
  ======================================================= */

  filterProductsByNearbyStores<T extends { storeName: string }>(
    products: T[]
  ): T[] {

    const nearbyStoreNames =
      this.getNearbyStoreNames();


    /*
     * If there are no nearby stores, return no products.
     *
     * This is intentional.
     *
     * We must never expose products from stores that
     * have not been confirmed as deliverable.
     */

    if (
      nearbyStoreNames.length === 0
    ) {

      return [];

    }


    return products.filter(
      product => {

        const productStoreName =
          this.normalizeStoreName(
            product.storeName
          );


        return nearbyStoreNames.includes(
          productStoreName
        );

      }
    );

  }


  /* =======================================================
     NORMALIZE STORE NAME
  ======================================================= */

  private normalizeStoreName(
    storeName: string
  ): string {

    return (
      storeName ||
      ''
    )
      .trim()
      .toLowerCase();

  }


  /* =======================================================
     SAVE LOCATION STATE
  ======================================================= */

  private saveLocationState(): void {

    if (
      !this.currentLocation
    ) {

      return;

    }


    try {

      localStorage.setItem(

        this.LOCATION_KEY,

        JSON.stringify({

          latitude:
            this.currentLocation.latitude,

          longitude:
            this.currentLocation.longitude,

          accuracy:
            this.currentLocation.accuracy

        })

      );


      localStorage.setItem(

        this.NEARBY_STORES_KEY,

        JSON.stringify(
          this.currentLocation.nearbyStores
        )

      );

    } catch (error) {

      console.error(
        'Unable to save location state:',
        error
      );

    }

  }


  /* =======================================================
     RESTORE LOCATION STATE
  ======================================================= */

  private restoreStoredLocation(): void {

    try {

      const storedLocation =
        localStorage.getItem(
          this.LOCATION_KEY
        );


      const storedStores =
        localStorage.getItem(
          this.NEARBY_STORES_KEY
        );


      if (
        !storedLocation ||
        !storedStores
      ) {

        return;

      }


      const location =
        JSON.parse(
          storedLocation
        );


      const stores:
        NearbyStore[] =
        JSON.parse(
          storedStores
        );


      if (
        typeof location.latitude !== 'number' ||
        typeof location.longitude !== 'number'
      ) {

        return;

      }


      const deliverableStores =
        stores.filter(
          store =>
            store.deliversToCustomer === true
        );


      this.currentLocation = {

        latitude:
          location.latitude,

        longitude:
          location.longitude,

        accuracy:
          location.accuracy || 0,

        nearbyStores:
          deliverableStores,

        nearbyStoreNames:
          deliverableStores.map(
            store =>
              this.normalizeStoreName(
                store.storeName
              )
          )

      };


      console.log(
        'RESTORED CUSTOMER LOCATION:',
        this.currentLocation
      );

    } catch (error) {

      console.error(
        'Unable to restore stored location:',
        error
      );


      this.clearLocation();

    }

  }


  /* =======================================================
     CLEAR LOCATION
  ======================================================= */

  clearLocation(): void {

    this.currentLocation = null;


    try {

      localStorage.removeItem(
        this.LOCATION_KEY
      );

      localStorage.removeItem(
        this.NEARBY_STORES_KEY
      );

    } catch (error) {

      console.error(
        'Unable to clear location:',
        error
      );

    }

  }


  /* =======================================================
     REFRESH LOCATION
  ======================================================= */

  async refreshLocation():
    Promise<CustomerLocationState> {

    /*
     * Clear old location first.
     */

    this.clearLocation();


    /*
     * Get completely fresh GPS location
     * and nearby stores.
     */

    return this.initializeLocation();

  }


  /* =======================================================
     GET CUSTOMER GPS LOCATION
  ======================================================= */

  getGpsLocation():
    UserLocation | null {

    if (
      !this.currentLocation
    ) {

      return null;

    }


    return {

      latitude:
        this.currentLocation.latitude,

      longitude:
        this.currentLocation.longitude,

      accuracy:
        this.currentLocation.accuracy

    };

  }

}