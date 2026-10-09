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

    /*
     * Browser
     */

    if (!this.isNativePlatform()) {

      return 'prompt';

    }


    /*
     * Android / Native
     */

    const permissions =
      await Geolocation.checkPermissions();

    return permissions.location;

  }


  /* ====================================================
     REQUEST LOCATION PERMISSION
  ==================================================== */

  async requestPermission(): Promise<string> {

    /*
     * Browser
     *
     * Browser permission is requested automatically
     * when navigator.geolocation.getCurrentPosition()
     * is called.
     */

    if (!this.isNativePlatform()) {

      return 'prompt';

    }


    /*
     * Android / Native
     */

    const permissions =
      await Geolocation.requestPermissions();

    return permissions.location;

  }


  /* ====================================================
     GET CURRENT LOCATION
  ==================================================== */
/* ====================================================
   GET CURRENT LOCATION
==================================================== */

async getCurrentLocation(): Promise<UserLocation> {

  /*
   * TESTING LOCATION
   * Vizag / Visakhapatnam
   */

  return {

    latitude: 17.6868,

    longitude: 83.2185,

    accuracy: 1000

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