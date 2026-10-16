
import {
  Component,
  ChangeDetectorRef,
  OnInit,
  OnDestroy
} from '@angular/core';

import {
  RouterLink,
  RouterLinkActive,
  Router,
  NavigationEnd
} from '@angular/router';

import {
  IonTabs,
  IonTabBar,
  IonTabButton,
  IonIcon,
  IonLabel,
  IonBadge,
  Platform
} from '@ionic/angular';

import { Subscription, filter } from 'rxjs';
import { addIcons } from 'ionicons';

import {
  homeOutline,
  gridOutline,
  cartOutline,
  cubeOutline,
  syncOutline,
  storefrontOutline,
  peopleOutline,
  receiptOutline,
  giftOutline,
  pricetagsOutline,
  ellipsisHorizontalOutline
} from 'ionicons/icons';

import { CartService } from '../services/cart.service';
import { AuthService } from '../services/auth.service';

interface TabItem {
  label: string;
  route: string;
  icon: string;
}

@Component({
  selector: 'app-tabs',
  standalone: true,
  templateUrl: './tabs.page.html',
  styleUrls: ['./tabs.page.scss'],
  imports: [
    IonTabs,
    IonTabBar,
    IonTabButton,
    IonIcon,
    IonLabel,
    IonBadge,
    RouterLink,
    RouterLinkActive
  ]
})
export class TabsPage implements OnInit, OnDestroy {

  cartCount = 0;
  role: string | null = null;

  private cartSubscription?: Subscription;
  private navigationSubscription?: Subscription;
  private backButtonSubscription?: Subscription;

  private routeHistory: string[] = [];
  private isHandlingNativeBack = false;

  private readonly categoriesTab: TabItem = {
    label: 'Categories',
    route: 'adm-categories',
    icon: 'pricetags-outline'
  };

  vendorTabs: TabItem[] = [
      {
      label: 'My Products',
      route: 'vend-products',
      icon: 'grid-outline'
    },
    this.categoriesTab,

      {
    label: 'Combos',
    route: 'vend-combo-add',
    icon: 'gift-outline'
  },

    {
      label: 'Orders',
      route: 'vend-orders',
      icon: 'sync-outline'
    },
    {
      label: 'Shop',
      route: 'shop',
      icon: 'storefront-outline'
    }
  ];

  adminTabs: TabItem[] = [
    {
      label: 'Products',
      route: 'adm-products',
      icon: 'cube-outline'
    },
    {
      label: 'Vendors',
      route: 'adm-vendors',
      icon: 'people-outline'
    },
    this.categoriesTab,
    {
      label: 'Orders',
      route: 'adm-orders',
      icon: 'receipt-outline'
    }
  ];

  constructor(
    private authService: AuthService,
    private cartService: CartService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private platform: Platform
  ) {
    addIcons({
      homeOutline,
      gridOutline,
      cartOutline,
      cubeOutline,
      syncOutline,
      storefrontOutline,
      peopleOutline,
      receiptOutline,
      ellipsisHorizontalOutline,
      pricetagsOutline,
      giftOutline
    });
  }

  ionViewWillEnter(): void {
    this.role = this.authService.getRole();

    const currentUrl = this.router.url;

    if (
      this.role === 'ADMIN' &&
      (currentUrl === '/tabs' || currentUrl === '/tabs/')
    ) {
      void this.router.navigateByUrl('/tabs/products', {
        replaceUrl: true
      });
    } else if (
      this.role === 'VENDOR' &&
      (currentUrl === '/tabs' || currentUrl === '/tabs/')
    ) {
      void this.router.navigateByUrl('/tabs/products', {
        replaceUrl: true
      });
    }

    this.cdr.detectChanges();
  }

  ngOnInit(): void {
    // Preserve existing cart-count subscription.
    this.cartSubscription = this.cartService.cart$.subscribe(cart => {
      this.cartCount = cart?.totalItems ?? 0;
      this.cdr.markForCheck();
    });

    // Track the current route and subsequent navigations.
    this.trackNavigation(this.router.url);

    this.navigationSubscription = this.router.events
      .pipe(
        filter(
          (event): event is NavigationEnd =>
            event instanceof NavigationEnd
        )
      )
      .subscribe(event => {
        this.trackNavigation(event.urlAfterRedirects);
      });

    // Register Android/Ionic native Back handling.
    this.registerNativeBackButton();
  }

  private trackNavigation(url: string): void {
    // Only track admin/vendor tab routes.
    if (!url.startsWith('/tabs')) {
      this.routeHistory = [];
      return;
    }

    const lastUrl =
      this.routeHistory[this.routeHistory.length - 1];

    // Avoid duplicate entries for the same URL.
    if (lastUrl !== url) {
      this.routeHistory.push(url);
    }

    // Keep history bounded.
    if (this.routeHistory.length > 50) {
      this.routeHistory.shift();
    }
  }


private registerNativeBackButton(): void {
  this.backButtonSubscription =
    this.platform.backButton.subscribeWithPriority(
      9999,
      (processNextHandler) => {

        const currentUrl = this.router.url.split('?')[0];

        // Do not handle Back outside admin/vendor tabs.
        if (!currentUrl.startsWith('/tabs')) {
          processNextHandler();
          return;
        }

        if (this.isHandlingNativeBack) {
          return;
        }

        // Native Back must do nothing on the main pages.
        const landingUrl =
          this.role === 'ADMIN'
            ? '/tabs/adm-products'
            : '/tabs/products';

        if (currentUrl === landingUrl) {
          return;
        }

        // Find the current route before modifying history.
        const currentIndex =
          this.routeHistory.lastIndexOf(currentUrl);

        const previousUrl =
          currentIndex > 0
            ? this.routeHistory[currentIndex - 1]
            : null;

        if (previousUrl && previousUrl !== currentUrl) {
          this.isHandlingNativeBack = true;
          this.routeHistory.splice(currentIndex);

          void this.router.navigateByUrl(previousUrl, {
            replaceUrl: true
          }).finally(() => {
            this.isHandlingNativeBack = false;
          });

          return;
        }

        // No previous route: stay on the current page.
        return;
      }
    );
}


  ngOnDestroy(): void {
    this.cartSubscription?.unsubscribe();
    this.navigationSubscription?.unsubscribe();
    this.backButtonSubscription?.unsubscribe();
  }
}
