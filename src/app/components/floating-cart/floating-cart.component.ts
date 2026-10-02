import {
  ChangeDetectorRef,
  Component,
  HostListener,
  OnDestroy,
  OnInit
} from '@angular/core';

import {
  IonBadge,
  IonButton,
  IonIcon
} from '@ionic/angular';

import {
  addIcons
} from 'ionicons';

import {
  cartOutline
} from 'ionicons/icons';

import {
  Subscription
} from 'rxjs';

import {
  Router
} from '@angular/router';

import {
  CartService
} from '../../services/cart.service';


@Component({
  selector: 'app-floating-cart',

  standalone: true,

  imports: [
    IonBadge,
    IonButton,
    IonIcon
  ],

  templateUrl:
    './floating-cart.component.html'
})
export class FloatingCartComponent
  implements OnInit, OnDestroy {


  cartCount = 0;


  /*
   * Current floating position.
   *
   * right/bottom are used instead of
   * left/top so the initial position
   * remains your existing position.
   */
  right = 18;

  bottom = 22;


  /*
   * Drag state.
   */
  private isDragging = false;

  private hasMoved = false;

  private startX = 0;

  private startY = 0;

  private startRight = 18;

  private startBottom = 22;


  /*
   * Prevent click after dragging.
   */
  private suppressClick = false;


  private cartSubscription?: Subscription;


  constructor(
    private readonly cartService: CartService,

    private readonly router: Router,

    private readonly cdr: ChangeDetectorRef
  ) {

    addIcons({
      cartOutline
    });

  }


  ngOnInit(): void {

    /*
     * Get current cart state immediately.
     */
    this.cartCount =
      this.cartService.getCartItemCount();


    /*
     * Listen to the central CartService.
     */
    this.cartSubscription =
      this.cartService.cart$
        .subscribe(cart => {

          this.cartCount =
            Number(
              cart?.totalItems ?? 0
            );

          this.cdr.detectChanges();

        });

  }


  ngOnDestroy(): void {

    this.cartSubscription?.unsubscribe();

  }


  /* =====================================================
     START DRAG
  ===================================================== */

  startDrag(event: PointerEvent): void {

    /*
     * Only react to the primary pointer.
     */
    if (event.button !== 0) {
      return;
    }


    this.isDragging = true;

    this.hasMoved = false;

    this.suppressClick = false;


    this.startX =
      event.clientX;

    this.startY =
      event.clientY;


    this.startRight =
      this.right;

    this.startBottom =
      this.bottom;


    /*
     * Keep receiving pointer events even if
     * the pointer moves outside the button.
     */
    const target =
      event.currentTarget as HTMLElement;


    target.setPointerCapture(
      event.pointerId
    );

  }


  /* =====================================================
     DRAG
  ===================================================== */

  drag(event: PointerEvent): void {

    if (!this.isDragging) {
      return;
    }


    const deltaX =
      event.clientX -
      this.startX;


    const deltaY =
      event.clientY -
      this.startY;


    /*
     * Ignore tiny movements so a normal
     * tap remains a click.
     */
    if (
      Math.abs(deltaX) > 5 ||
      Math.abs(deltaY) > 5
    ) {

      this.hasMoved = true;

    }


    if (!this.hasMoved) {
      return;
    }


    /*
     * Because right/bottom are being used:
     *
     * moving right  -> right decreases
     * moving left   -> right increases
     *
     * moving down   -> bottom decreases
     * moving up     -> bottom increases
     */
    let newRight =
      this.startRight -
      deltaX;


    let newBottom =
      this.startBottom -
      deltaY;


    /*
     * Floating button dimensions.
     */
    const buttonSize = 54;

    const margin = 8;


    /*
     * Keep inside viewport horizontally.
     */
    const maxRight =
      window.innerWidth -
      buttonSize -
      margin;


    /*
     * Keep inside viewport vertically.
     */
    const maxBottom =
      window.innerHeight -
      buttonSize -
      margin;


    newRight =
      Math.max(
        margin,
        Math.min(
          newRight,
          maxRight
        )
      );


    newBottom =
      Math.max(
        margin,
        Math.min(
          newBottom,
          maxBottom
        )
      );


    this.right =
      newRight;

    this.bottom =
      newBottom;


    this.cdr.detectChanges();


    event.preventDefault();

  }


  /* =====================================================
     END DRAG
  ===================================================== */

  endDrag(event: PointerEvent): void {

    if (!this.isDragging) {
      return;
    }


    this.isDragging = false;


    /*
     * If the user actually moved the cart,
     * suppress the following click.
     */
    if (this.hasMoved) {

      this.suppressClick = true;

    }


    const target =
      event.currentTarget as HTMLElement;


    if (
      target.hasPointerCapture(
        event.pointerId
      )
    ) {

      target.releasePointerCapture(
        event.pointerId
      );

    }

  }


  /* =====================================================
     OPEN CART
  ===================================================== */

  openCart(): void {

    /*
     * A drag should not open the cart.
     */
    if (this.suppressClick) {

      this.suppressClick = false;

      return;

    }


    this.router.navigate([
      '/cart'
    ]);

  }

}