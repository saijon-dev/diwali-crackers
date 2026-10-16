import { Injectable } from '@angular/core';

import {
  Capacitor
} from '@capacitor/core';

import {
  Geolocation,
  Position
} from '@capacitor/geolocation';

import {
  Observable
} from 'rxjs';


export interface UserLocation {

  latitude: number;

  longitude: number;

  accuracy: number;

}


@Injectable({
  providedIn: 'root'
})
export class LocationService {

  


  /* ====================================================
     CHECK IF RUNNING NATIVE
  ==================================================== */

  private isNativePlatform(): boolean {

    return Capacitor.isNativePlatform();

  }


  /* ====================================================
     CHECK LOCATION PERMISSION
  ==================================================== */


async checkPermission(): Promise<string> {
  if (!Capacitor.isNativePlatform()) {
    return 'prompt';
  }

  try {
    const permissions = await Geolocation.checkPermissions();

    if (!permissions || typeof permissions !== 'object') {
      throw new Error(
        'Geolocation returned an invalid permission status.'
      );
    }

    if (
      permissions.location === 'granted' ||
      permissions.coarseLocation === 'granted'
    ) {
      return 'granted';
    }

    return 'denied';
  } catch (error: unknown) {
    console.error('Location permission check failed:', error);
    throw error;
  }
}

async requestPermission(): Promise<string> {
  if (!Capacitor.isNativePlatform()) {
    return 'prompt';
  }

  try {
    const permissions = await Geolocation.requestPermissions({
      permissions: ['location', 'coarseLocation']
    });

    if (!permissions || typeof permissions !== 'object') {
      throw new Error(
        'Geolocation returned an invalid permission response.'
      );
    }

    if (
      permissions.location === 'granted' ||
      permissions.coarseLocation === 'granted'
    ) {
      return 'granted';
    }

    return 'denied';
  } catch (error: unknown) {
    console.error('Location permission request failed:', error);
    throw error;
  }
}

async getCurrentLocation(): Promise<UserLocation> {
  if (Capacitor.isNativePlatform()) {
    try {
      // Request permission directly. Android will not show
      // another dialog if the required permission is granted.
      const permission = await this.requestPermission();

      if (permission !== 'granted') {
        throw new Error(
          'Location permission was denied. Allow location access in Android Settings.'
        );
      }

      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 30000,
        maximumAge: 0
      });

      const location: UserLocation = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy
      };

      console.log('NATIVE GPS COORDINATES:', location);

      return location;
    } catch (error: unknown) {
      console.error('Native location retrieval failed:', error);
      throw error;
    }
  }

  // Browser location: use Chrome/Edge's geolocation API.
  if (!navigator.geolocation) {
    throw new Error(
      'Geolocation is not supported by this browser.'
    );
  }

  const position = await new Promise<GeolocationPosition>(
    (resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        resolve,
        reject,
        {
          enableHighAccuracy: false,
          timeout: 30000,
          maximumAge: 0
        }
      );
    }
  );

  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    accuracy: position.coords.accuracy
  };
}




  /* ====================================================
     BROWSER LOCATION
  ==================================================== */
private getBrowserLocation():
  Promise<UserLocation> {

  return new Promise<UserLocation>(
    (
      resolve,
      reject
    ) => {

      if (!navigator.geolocation) {

        reject(
          new Error(
            'Geolocation is not supported by this browser.'
          )
        );

        return;

      }


      navigator.geolocation.getCurrentPosition(

        position => {

          console.log(
            'BROWSER LOCATION RECEIVED:',
            position
          );


          resolve({

            latitude:
              position.coords.latitude,

            longitude:
              position.coords.longitude,

            accuracy:
              position.coords.accuracy

          });

        },


        error => {

          console.error(
            'BROWSER GEOLOCATION ERROR:',
            error
          );


          let message =
            'Unable to get your location.';


          switch (
            error.code
          ) {

            case error.PERMISSION_DENIED:

              message =
                'Location permission was denied.';

              break;


            case error.POSITION_UNAVAILABLE:

              message =
                'Location information is unavailable.';

              break;


            case error.TIMEOUT:

              message =
                'Location request timed out.';

              break;

          }


          reject(
            new Error(message)
          );

        },


        {

          /*
           * Don't force GPS-level accuracy in the
           * browser. Let the browser use its available
           * location provider.
           */

          enableHighAccuracy: false,

          /*
           * Give the browser more time.
           */

          timeout: 60000,

          /*
           * Don't use an old cached position.
           */

          maximumAge: 0

        }

      );

    }
  );

}


  /* ====================================================
     OBSERVABLE
  ==================================================== */

  getCurrentLocation$():
    Observable<UserLocation> {

    return new Observable<UserLocation>(
      observer => {

        this.getCurrentLocation()

          .then(
            location => {

              observer.next(
                location
              );

              observer.complete();

            }
          )

          .catch(
            error => {

              observer.error(
                error
              );

            }
          );

      }
    );

  }


  private async getNativePermissions() {
  const permissions = await Geolocation.checkPermissions();

  if (!permissions || typeof permissions !== 'object') {
    throw new Error(
      'Unable to read the device location permission status.'
    );
  }

  return permissions;
}


  /* ====================================================
     WATCH LOCATION
  ==================================================== */

  async watchLocation(

    callback: (
      location: UserLocation
    ) => void,

    errorCallback?: (
      error: any
    ) => void

  ): Promise<string> {


    /*
     * Browser
     */

    if (!this.isNativePlatform()) {

      return this.watchBrowserLocation(
        callback,
        errorCallback
      );

    }


    /*
     * Android / Native
     */

    let permission =
      await this.checkPermission();


    if (
      permission !== 'granted'
    ) {

      permission =
        await this.requestPermission();

    }


    if (
      permission !== 'granted'
    ) {

      throw new Error(
        'Location permission was not granted.'
      );

    }


    const watchId =
      await Geolocation.watchPosition(

        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 5000
        },

        (
          position,
          error
        ) => {

          if (error) {

            if (errorCallback) {

              errorCallback(
                error
              );

            }

            return;

          }


          if (!position) {

            return;

          }


          callback({

            latitude:
              position.coords.latitude,

            longitude:
              position.coords.longitude,

            accuracy:
              position.coords.accuracy

          });

        }

      );


    return watchId;

  }


  /* ====================================================
     BROWSER LOCATION WATCH
  ==================================================== */

  private watchBrowserLocation(

    callback: (
      location: UserLocation
    ) => void,

    errorCallback?: (
      error: any
    ) => void

  ): Promise<string> {

    return new Promise<string>(
      (
        resolve,
        reject
      ) => {

        if (
          !navigator.geolocation
        ) {

          const error =
            new Error(
              'Geolocation is not supported by this browser.'
            );


          if (errorCallback) {

            errorCallback(error);

          }


          reject(error);

          return;

        }


        const watchId =
          navigator.geolocation.watchPosition(

            position => {

              callback({

                latitude:
                  position.coords.latitude,

                longitude:
                  position.coords.longitude,

                accuracy:
                  position.coords.accuracy

              });

            },


            error => {

              if (errorCallback) {

                errorCallback(error);

              }

            },


            {

              enableHighAccuracy: true,

              timeout: 15000,

              maximumAge: 5000

            }

          );


        resolve(
          watchId.toString()
        );

      }
    );

  }


  /* ====================================================
     STOP WATCHING
  ==================================================== */

  async stopWatching(
    watchId: string
  ): Promise<void> {

    /*
     * Browser
     */

    if (!this.isNativePlatform()) {

      const id =
        Number(watchId);


      if (
        !Number.isNaN(id)
      ) {

        navigator.geolocation.clearWatch(
          id
        );

      }


      return;

    }


    /*
     * Android / Native
     */

    await Geolocation.clearWatch({

      id: watchId

    });

  }

}