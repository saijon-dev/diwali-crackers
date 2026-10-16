import { Injectable } from '@angular/core';

import {
  HttpClient,
  HttpParams
} from '@angular/common/http';

import {
  firstValueFrom
} from 'rxjs';

import { environment } from '../../environments/environment';

import {
  LocationService,
  UserLocation
} from './location.service';



interface ReverseGeocodeResponse {
  display_name?: string;
  address?: {
    road?: string;
    neighbourhood?: string;
    suburb?: string;
    village?: string;
    town?: string;
    city?: string;
    county?: string;
    state?: string;
    postcode?: string;
  };
}


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

  private readonly LOCATION_KEY =
    'diwali_customer_location';

  private readonly NEARBY_STORES_KEY =
    'diwali_nearby_stores';

  private readonly apiUrl =
    environment.apiUrl;


  /* =======================================================
     CURRENT STATE
  ======================================================= */

  private currentLocation:
    CustomerLocationState | null = null;


  /*
   * If multiple API calls ask for location at the same
   * time, they all use the same initialization promise.
   *
   * This prevents:
   *
   * GPS → nearby stores
   * GPS → nearby stores
   * GPS → nearby stores
   *
   * from happening simultaneously.
   */
  private initializationPromise:
    Promise<CustomerLocationState> | null = null;


  constructor(
    private readonly locationService: LocationService,
    private readonly http: HttpClient
  ) {

  }


  /* =========================================================
     INITIALIZE LOCATION
  ========================================================= */

  async initializeLocation():
    Promise<CustomerLocationState> {

    /*
     * Already initialized during this application session.
     */
    if (this.currentLocation) {
      return this.currentLocation;
    }


   


    /*
     * Another request may already be initializing location.
     *
     * Reuse it instead of starting another GPS/API cycle.
     */
    if (this.initializationPromise) {
      return this.initializationPromise;
    }


    this.initializationPromise =
      this.initializeFromGps();


    try {

      return await this.initializationPromise;

    } finally {

      this.initializationPromise = null;

    }

  }


  /* =========================================================
     INITIALIZE FROM GPS
  ========================================================= */

  private async initializeFromGps():
    Promise<CustomerLocationState> {
const location = await this.locationService.getCurrentLocation();

console.log('GPS coordinates received:', {
  latitude: location.latitude,
  longitude: location.longitude,
  accuracy: location.accuracy
});


    const nearbyStores =
      await this.getNearbyStores(
        location.latitude,
        location.longitude
      );


    /*
     * Only stores that explicitly deliver to the customer
     * are allowed.
     */
    const deliverableStores =
      nearbyStores.filter(
        store =>
          store.deliversToCustomer === true
      );


    const nearbyStoreNames =
      deliverableStores.map(
        store =>
          this.normalizeStoreName(
            store.storeName
          )
      );


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


    this.saveLocationState();


    console.log(
      'CUSTOMER LOCATION STATE:',
      this.currentLocation
    );


    return this.currentLocation;

  }


  /* =========================================================
     GET NEARBY STORES
  ========================================================= */

  getNearbyStores(
    latitude: number,
    longitude: number,
    page: number = 0,
    size: number = 10
  ): Promise<NearbyStore[]> {

    const params =
      new HttpParams()
        .set('latitude', latitude)
        .set('longitude', longitude)
        .set('page', page)
        .set('size', size);


    return firstValueFrom(
      this.http.get<{
        content: NearbyStore[];
      }>(
        `${this.apiUrl}/diwali/stores/nearby`,
        { params }
      )
    ).then(
      response =>
        response?.content ?? []
    );

  }


  /* =========================================================
     CURRENT LOCATION STATE
  ========================================================= */

  getCurrentLocationState():
    CustomerLocationState | null {

    return this.currentLocation;

  }


  /* =========================================================
     NEARBY STORES
  ========================================================= */

  getNearbyStoresFromState():
    NearbyStore[] {

    return (
      this.currentLocation?.nearbyStores ??
      []
    );

  }


  /* =========================================================
     NEARBY STORE NAMES
  ========================================================= */

  getNearbyStoreNames():
    string[] {

    return (
      this.currentLocation?.nearbyStoreNames ??
      []
    );

  }


  /* =========================================================
     CHECK STORE
  ========================================================= */

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


  /* =========================================================
     FILTER PRODUCTS
  ========================================================= */

  filterProductsByNearbyStores<T extends {
    storeName: string;
  }>(
    products: T[]
  ): T[] {

    const nearbyStoreNames =
      this.getNearbyStoreNames();


    if (nearbyStoreNames.length === 0) {
      return [];
    }


    return products.filter(
      product =>
        nearbyStoreNames.includes(
          this.normalizeStoreName(
            product.storeName
          )
        )
    );

  }


  /* =========================================================
     NORMALIZE STORE NAME
  ========================================================= */

  private normalizeStoreName(
    storeName: string
  ): string {

    return (
      storeName ?? ''
    )
      .trim()
      .toLowerCase();

  }


  /* =========================================================
     SAVE LOCATION
  ========================================================= */

  private saveLocationState(): void {

    if (!this.currentLocation) {
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


  /* =========================================================
     RESTORE LOCATION
  ========================================================= */

  private restoreStoredLocation(): void {

    /*
     * Don't repeatedly parse localStorage once the
     * in-memory state already exists.
     */
    if (this.currentLocation) {
      return;
    }


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


      const stores =
        JSON.parse(
          storedStores
        ) as NearbyStore[];


      if (
        typeof location.latitude !== 'number' ||
        typeof location.longitude !== 'number' ||
        !Array.isArray(stores)
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
          typeof location.accuracy === 'number'
            ? location.accuracy
            : 0,

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


  /* =========================================================
     CLEAR LOCATION
  ========================================================= */

  clearLocation(): void {

    this.currentLocation = null;

    this.initializationPromise = null;


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


  /* =========================================================
     REFRESH LOCATION
  ========================================================= */

  async refreshLocation():
    Promise<CustomerLocationState> {

    this.clearLocation();

    return this.initializeLocation();

  }


  /* =========================================================
     GPS LOCATION
  ========================================================= */

  getGpsLocation():
    UserLocation | null {

    if (!this.currentLocation) {
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



  async reverseGeocode(
  latitude: number,
  longitude: number
): Promise<string> {
  const params = new HttpParams()
    .set('format', 'jsonv2')
    .set('lat', latitude)
    .set('lon', longitude)
    .set('addressdetails', '1');

  const result = await firstValueFrom(
    this.http.get<ReverseGeocodeResponse>(
      'https://nominatim.openstreetmap.org/reverse',
      { params }
    )
  );

  const address = result.address;

  if (!address) {
    throw new Error('No address details were found.');
  }

  const locality =
    address.neighbourhood ||
    address.suburb ||
    address.village ||
    address.town ||
    address.city;

  const city =
    address.city ||
    address.town ||
    address.village ||
    address.county;

  const parts = [
    address.road,
    locality,
    city,
    address.state,
    address.postcode
  ].filter(
    (part, index, all): part is string =>
      !!part && all.indexOf(part) === index
  );

  if (parts.length === 0) {
    throw new Error('Unable to determine the delivery address.');
  }

  return parts.join(', ');
}

}