
import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationStart,
  Router
} from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-navigation-loader',
  standalone: true,
  template: `
    @if (isLoading) {
      <div
        class="navigation-loader-overlay"
        role="status"
        aria-label="Loading page"
        aria-live="polite"
      >
        <div class="navigation-loader-content">
          <img
            src="assets/images/loader-design.png"
            alt=""
            aria-hidden="true"
            class="navigation-loader-image"
          />
        </div>
      </div>
    }
  `,
  styles: [`
    .navigation-loader-overlay {
      position: fixed;
      inset: 0;
      z-index: 99999;
      display: flex;
      align-items: center;
      justify-content: center;

      /* Fade the page behind the loader */
      background: rgba(255, 253, 247, 0.58);

      /* Slightly soften the background */
      backdrop-filter: blur(1.5px);
      -webkit-backdrop-filter: blur(1.5px);

      pointer-events: all;
      animation: overlayFadeIn 160ms ease-out;
    }

    .navigation-loader-content {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 104px;
      height: 104px;
      border-radius: 50%;
      background: rgba(255, 253, 247, 0.82);
      box-shadow: 0 6px 24px rgba(83, 12, 27, 0.12);
    }

    .navigation-loader-image {
      display: block;
      width: 82px;
      height: 82px;
      object-fit: contain;
      animation: loaderPulse 1.5s ease-in-out infinite;
    }

    @keyframes loaderPulse {
      0%, 100% {
        transform: scale(0.96);
        opacity: 0.88;
      }

      50% {
        transform: scale(1.04);
        opacity: 1;
      }
    }

    @keyframes overlayFadeIn {
      from {
        opacity: 0;
      }

      to {
        opacity: 1;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .navigation-loader-image {
        animation: none;
      }

      .navigation-loader-overlay {
        animation: none;
      }
    }
  `]
})
export class NavigationLoaderComponent implements OnInit, OnDestroy {
  isLoading = false;

  private routerSubscription?: Subscription;

  constructor(private readonly router: Router) {}

  ngOnInit(): void {
    this.routerSubscription = this.router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        this.isLoading = true;
      }

      if (
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError
      ) {
        this.isLoading = false;
      }
    });
  }

  ngOnDestroy(): void {
    this.routerSubscription?.unsubscribe();
  }
}