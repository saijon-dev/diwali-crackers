
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { IonApp, IonRouterOutlet, Platform } from '@ionic/angular';
import { App } from '@capacitor/app';
import { Subscription } from 'rxjs';
import { LocationStateService } from './services/location-state.service';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent implements OnInit, OnDestroy {

  @ViewChild(IonRouterOutlet)
  private routerOutlet!: IonRouterOutlet;

  private backButtonSubscription?: Subscription;

  constructor(
    private readonly locationStateService: LocationStateService,
    private readonly platform: Platform,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    void this.setupBackButton();
  }

  private async setupBackButton(): Promise<void> {
    await this.platform.ready();

    this.backButtonSubscription?.unsubscribe();

    this.backButtonSubscription = this.platform.backButton.subscribeWithPriority(
      10,
      () => {
        void this.handleBackButton();
      }
    );
  }

  private async handleBackButton(): Promise<void> {
    const currentUrl = this.router.url.split('?')[0].split('#')[0];

    // Go back through Ionic's navigation stack when possible.
    if (this.routerOutlet?.canGoBack()) {
      await this.routerOutlet.pop();
      return;
    }

    // If there is no previous page, return to Home.
    if (currentUrl !== '/home' && currentUrl !== '/') {
      await this.router.navigateByUrl('/home', {
        replaceUrl: true,
      });
      return;
    }

    // At Home, close the app on Android.
    if (this.platform.is('capacitor') && this.platform.is('android')) {
      await App.exitApp();
    }
  }

  ngOnDestroy(): void {
    this.backButtonSubscription?.unsubscribe();
  }
}
