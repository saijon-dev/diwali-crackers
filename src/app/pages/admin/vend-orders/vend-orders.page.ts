import {
  ChangeDetectorRef,
  Component,
  QueryList,
  ViewChildren
} from '@angular/core';

import { FormsModule } from '@angular/forms';

import {
  IonContent,
  IonIcon,
  IonButton,
  IonSelect,
  IonSelectOption,
  IonInput,
  IonBackButton,
  ToastController,
  IonRefresher,
  IonRefresherContent
} from '@ionic/angular';

import { DecimalPipe } from '@angular/common';
import { addIcons } from 'ionicons';
import {
  // Keep your existing icons...
  shieldCheckmarkOutline
} from 'ionicons/icons';

import {
  receiptOutline,
  cubeOutline,
  callOutline,
  checkmarkCircleOutline,
  timeOutline,
  chevronForwardOutline,
  arrowBackOutline,
  closeCircleOutline,
  alertCircleOutline,
  hourglassOutline,
  calendarOutline,
  locationOutline
} from 'ionicons/icons';

import {
  VendorOrderService,
  VendorOrder
} from '../../../services/vendor-order.service';

type OrderView = 'new' | 'confirmed';

type VendorOrderStatus =
  | 'CONFIRMED'
  | 'PACKED'
  | 'SHIPPED'
  | 'OUT_FOR_DELIVERY';

@Component({
  selector: 'app-ven-orders',
  standalone: true,
  templateUrl: './vend-orders.page.html',
  imports: [
    IonContent,
    IonIcon,
    IonButton,
    IonSelect,
    IonSelectOption,
    DecimalPipe,
    IonInput,
    IonBackButton,
    IonRefresher,
    IonRefresherContent
  ]
})
export class VendOrdersPage {



private activeRefresher: HTMLIonRefresherElement | null = null;
private refreshRequestsRemaining = 0;


  pendingStatus: VendorOrderStatus | '' = '';
statusUpdateComplete = false;

deliveryOtpDigits: string[] = ['', '', '', '', '', ''];

@ViewChildren(IonInput)
otpInputs!: QueryList<IonInput>;
isVerifyingOtp = false;
otpErrorMessage = '';
otpSuccessMessage = '';

  currentView: OrderView = 'new';

  newOrders: VendorOrder[] = [];
  confirmedOrders: VendorOrder[] = [];

  selectedOrder: VendorOrder | null = null;
  showDetails = false;
isLoadingNewOrders = false;
isLoadingConfirmedOrders = false;
  confirmingOrderId: number | null = null;
  updatingStatusOrderId: number | null = null;

  errorMessage = '';
  successMessage = '';

  readonly statusOptions: VendorOrderStatus[] = [
    'CONFIRMED',
    'PACKED',
    'SHIPPED',
    'OUT_FOR_DELIVERY'
  ];

  constructor(
    private readonly vendorOrderService: VendorOrderService,
    private readonly cdr: ChangeDetectorRef,
    private readonly toastController: ToastController
  ) {
    addIcons({
      receiptOutline,
      cubeOutline,
      callOutline,
      checkmarkCircleOutline,
      timeOutline,
      chevronForwardOutline,
      arrowBackOutline,
      closeCircleOutline,
      alertCircleOutline,
      hourglassOutline,
      calendarOutline,
      locationOutline,
      shieldCheckmarkOutline
    });
  }

  /* ====================================================
     PAGE ENTER
  ==================================================== */

  ionViewWillEnter(): void {
    this.loadOrders();
  }

  /* ====================================================
     LOAD ORDERS
  ==================================================== */

  loadOrders(): void {
    this.loadNewOrders();
    this.loadConfirmedOrders();
  }

loadNewOrders(): void {

  this.isLoadingNewOrders = true;

  this.errorMessage = '';

  this.cdr.detectChanges();

  this.vendorOrderService
    .getReceivedOrders(0, 10)
    .subscribe({

      next: (response) => {

        this.newOrders =
          response?.content ?? [];

        this.isLoadingNewOrders = false;

        this.cdr.detectChanges();

        
this.completeRefreshRequest();


      },

      error: (error) => {

        console.error(
          'GET VENDOR RECEIVED ORDERS ERROR:',
          error
        );

        this.newOrders = [];

        this.isLoadingNewOrders = false;

        this.errorMessage =
          'Unable to load new orders.';

        this.cdr.detectChanges();

        
this.completeRefreshRequest();


      }

    });
}




handleRefresh(event: CustomEvent): void {
  this.activeRefresher =
    event.target as HTMLIonRefresherElement;

  this.refreshRequestsRemaining = 2;
  this.loadOrders();
}

private completeRefreshRequest(): void {
  if (!this.activeRefresher) {
    return;
  }

  this.refreshRequestsRemaining--;

  if (this.refreshRequestsRemaining <= 0) {
    const refresher = this.activeRefresher;
    this.activeRefresher = null;
    this.refreshRequestsRemaining = 0;

    void refresher.complete();
  }
}

loadConfirmedOrders(): void {

  this.isLoadingConfirmedOrders = true;

  this.vendorOrderService
    .getConfirmedOrders(0, 10)
    .subscribe({

      next: (response) => {

        this.confirmedOrders =
          response?.content ?? [];

        this.isLoadingConfirmedOrders = false;

        this.cdr.detectChanges();

        
this.completeRefreshRequest();


      },

      error: (error) => {

        console.error(
          'GET VENDOR CONFIRMED ORDERS ERROR:',
          error
        );

        this.confirmedOrders = [];

        this.isLoadingConfirmedOrders = false;

        this.cdr.detectChanges();

        
this.completeRefreshRequest();


      }

    });
}

  /* ====================================================
     VIEW AND CURRENT ORDERS
  ==================================================== */

  changeView(view: OrderView): void {
    this.currentView = view;
    this.showDetails = false;
    this.selectedOrder = null;
    this.errorMessage = '';
    this.successMessage = '';
  }

  get currentOrders(): VendorOrder[] {
    return this.currentView === 'confirmed'
      ? this.confirmedOrders
      : this.newOrders;
  }

  get isCurrentViewLoading(): boolean {
  return this.currentView === 'new'
    ? this.isLoadingNewOrders
    : this.isLoadingConfirmedOrders;
}

openOrder(order: VendorOrder): void {
  this.selectedOrder = order;
  this.pendingStatus = this.getSupportedStatus(order.vendorStatus);
  this.statusUpdateComplete = false;
  this.deliveryOtpDigits = ['', '', '', '', '', ''];
  this.otpErrorMessage = '';
  this.otpSuccessMessage = '';
  this.errorMessage = '';
  this.successMessage = '';
  this.showDetails = true;
}

private getSupportedStatus(
  status: string | null | undefined
): VendorOrderStatus | '' {
  const normalized = status?.toUpperCase();

  return this.statusOptions.includes(normalized as VendorOrderStatus)
    ? normalized as VendorOrderStatus
    : '';
}

backToOrders(): void {
  this.showDetails = false;
  this.selectedOrder = null;
  this.pendingStatus = '';
  this.statusUpdateComplete = false;
  this.deliveryOtpDigits = ['', '', '', '', '', ''];
  this.errorMessage = '';
  this.successMessage = '';
  this.otpErrorMessage = '';
  this.otpSuccessMessage = '';
}

  /* ====================================================
     CONFIRM ORDER
  ==================================================== */

confirmOrder(event: Event, order: VendorOrder): void {
  event.stopPropagation();

  if (
    this.confirmingOrderId !== null ||
    this.updatingStatusOrderId !== null
  ) {
    return;
  }

  this.confirmingOrderId = order.orderId;
  this.errorMessage = '';
  this.successMessage = '';

  this.vendorOrderService
    .updateOrderStatus(order.orderId, 'CONFIRMED')
    .subscribe({
      next: () => {
        this.confirmingOrderId = null;

        this.newOrders = this.newOrders.filter(
          item => item.orderId !== order.orderId
        );

        this.currentView = 'confirmed';
        this.showDetails = false;
        this.selectedOrder = null;

        this.successMessage =
          `Order #${order.orderId} confirmed.`;

        this.loadConfirmedOrders();

        void this.showOrderToast(
          this.successMessage,
          true
        );

        this.cdr.detectChanges();
      },

      error: (error) => {
        console.error(
          'CONFIRM VENDOR ORDER ERROR:',
          error
        );

        this.confirmingOrderId = null;

        const message =
          error?.error?.message ||
          error?.error?.error ||
          'Unable to confirm this order. Please try again.';

        this.errorMessage = message;

        void this.showOrderToast(message, false);

        this.cdr.detectChanges();
      }
    });
}

/* ====================================================
   SELECT STATUS — NO API CALL
==================================================== */

onStatusSelection(status: VendorOrderStatus): void {
  this.pendingStatus = status;
  this.otpErrorMessage = '';
  this.otpSuccessMessage = '';
  this.deliveryOtpDigits = ['', '', '', '', '', ''];
}

/* ====================================================
   UPDATE STATUS BUTTON / BACK BUTTON
==================================================== */
/* ====================================================
   UPDATE STATUS
   ==================================================== */

saveStatusOrBack(): void {

  if (!this.selectedOrder) {
    return;
  }

  const order = this.selectedOrder;
  const status = this.pendingStatus;

  if (!status) {
    this.errorMessage = 'Please select an order status.';
    return;
  }

  if (status === order.vendorStatus) {
    this.statusUpdateComplete = true;
    return;
  }

  if (
    this.updatingStatusOrderId !== null ||
    this.confirmingOrderId !== null
  ) {
    return;
  }

  this.updatingStatusOrderId = order.orderId;

  this.errorMessage = '';
  this.successMessage = '';
  this.otpErrorMessage = '';
  this.otpSuccessMessage = '';

  this.vendorOrderService
    .updateOrderStatus(order.orderId, status)
    .subscribe({

      next: () => {

        order.vendorStatus = status;

        this.updateOrderInList(this.newOrders, order);
        this.updateOrderInList(this.confirmedOrders, order);

        this.updatingStatusOrderId = null;

        this.successMessage =
          `Order #${order.orderId} updated to ${this.formatStatus(status)}.`;

          
void this.showOrderToast(
  this.successMessage,
  true
);


        /*
         * If the order is moved to OUT_FOR_DELIVERY,
         * stay on the details page because OTP verification
         * is required.
         */
        if (status === 'OUT_FOR_DELIVERY') {

          this.statusUpdateComplete = true;

          this.loadConfirmedOrders();

          this.cdr.detectChanges();

          return;
        }

        /*
         * For all other status updates, automatically
         * return to Confirmed Orders.
         */
        this.loadConfirmedOrders();

        this.showDetails = false;
        this.selectedOrder = null;
        this.currentView = 'confirmed';

        this.pendingStatus = '';
        this.statusUpdateComplete = false;

        this.deliveryOtpDigits = ['', '', '', '', '', ''];

        this.cdr.detectChanges();
      },

      error: (error) => {

       
const message =
  error?.error?.message ||
  error?.error?.error ||
  'Unable to update the order status. Please try again.';

this.errorMessage = message;

void this.showOrderToast(message, false);

        this.cdr.detectChanges();
      }

    });
}
/* ====================================================
   OTP INPUT
==================================================== */
/* ====================================================
   OTP INPUT
==================================================== */
/* ====================================================
   OTP INPUT
==================================================== */
/* ====================================================
   OTP INPUT
==================================================== */

async onOtpInput(
  value: string | number | null | undefined,
  index: number
): Promise<void> {

  const digit = String(value ?? '')
    .replace(/\D/g, '')
    .slice(-1);

  this.deliveryOtpDigits[index] = digit;

  this.otpErrorMessage = '';

  /*
   * If a digit was entered, automatically move
   * the cursor to the next OTP block.
   */
  if (digit && index < 5) {

    /*
     * Wait for Ionic to finish processing the
     * current ion-input event.
     */
    await new Promise(resolve =>
      setTimeout(resolve, 50)
    );

    const inputs = this.otpInputs.toArray();

    const nextInput = inputs[index + 1];

    if (nextInput) {
      await nextInput.setFocus();
    }
  }

  this.cdr.detectChanges();
}
/* ====================================================
   VERIFY DELIVERY OTP
==================================================== */

/* ====================================================
   VERIFY DELIVERY OTP
==================================================== */

verifyDeliveryOtp(): void {

  const order = this.selectedOrder;

  if (!order) {
    return;
  }

  const otp = this.deliveryOtpDigits.join('');

  if (otp.length !== 6) {
    this.otpErrorMessage =
      'Please enter the complete 6-digit OTP.';
    return;
  }

  if (!order.orderStoreId) {
    this.otpErrorMessage =
      'Delivery verification will be available when the order response includes orderStoreId.';
    return;
  }

  if (this.isVerifyingOtp) {
    return;
  }

  this.isVerifyingOtp = true;

  this.otpErrorMessage = '';
  this.otpSuccessMessage = '';

  this.vendorOrderService
    .verifyDeliveryOtp(
      order.orderId,
      order.customerMobile,
      otp,
      order.orderStoreId
    )
    .subscribe({

      next: () => {

        this.isVerifyingOtp = false;

        /*
         * OTP verification means delivery is completed.
         */
        order.vendorStatus = 'DELIVERED';

        this.updateOrderInList(
          this.confirmedOrders,
          order
        );

        /*
         * Refresh confirmed orders from backend.
         */
        this.loadConfirmedOrders();

        /*
         * Automatically return to Confirmed Orders.
         */
        this.showDetails = false;
        this.selectedOrder = null;

        this.currentView = 'confirmed';

        this.pendingStatus = '';

        this.statusUpdateComplete = false;

        this.deliveryOtpDigits =
          ['', '', '', '', '', ''];

      
this.otpSuccessMessage =
  'Order delivered successfully.';

void this.showOrderToast(
  this.otpSuccessMessage,
  true
);


        this.cdr.detectChanges();
      },

      error: (error) => {

   
const message =
  error?.error?.message ||
  error?.error?.error ||
  'Unable to verify the OTP. Please check it and try again.';

this.otpErrorMessage = message;

void this.showOrderToast(message, false);


        this.cdr.detectChanges();
      }

    });
}

  private updateOrderInList(
    orders: VendorOrder[],
    updatedOrder: VendorOrder
  ): void {
    const index = orders.findIndex(
      item => item.orderId === updatedOrder.orderId
    );

    if (index !== -1) {
      orders[index] = updatedOrder;
    }
  }

  /* ====================================================
     STATUS DISPLAY
  ==================================================== */

  formatStatus(status: string | null | undefined): string {
    if (!status) {
      return 'Unknown';
    }

    return status
      .toLowerCase()
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  getStatusClass(status: string): string {
    switch (status?.toUpperCase()) {
      case 'PLACED':
        return 'bg-amber-50 text-amber-800';

      case 'CONFIRMED':
        return 'bg-green-50 text-green-800';

      case 'PACKED':
        return 'bg-blue-50 text-blue-800';

      case 'SHIPPED':
      case 'SHIPED':
        return 'bg-violet-50 text-violet-800';

      case 'OUT_FOR_DELIVERY':
        return 'bg-orange-50 text-orange-800';

      case 'DELIVERED':
        return 'bg-emerald-50 text-emerald-800';

      case 'CANCELLED':
      case 'CANCELED':
        return 'bg-red-50 text-red-800';

      default:
        return 'bg-stone-100 text-stone-700';
    }
  }

  getStatusIcon(status: string): string {
    switch (status?.toUpperCase()) {
      case 'PLACED':
        return 'time-outline';

      case 'CONFIRMED':
      case 'DELIVERED':
        return 'checkmark-circle-outline';

      case 'PACKED':
        return 'cube-outline';

      case 'SHIPPED':
      case 'SHIPED':
      case 'OUT_FOR_DELIVERY':
        return 'hourglass-outline';

      case 'CANCELLED':
      case 'CANCELED':
        return 'close-circle-outline';

      default:
        return 'alert-circle-outline';
    }
  }

  /* ====================================================
     DATE FORMATTING
  ==================================================== */

  formatDate(value: string | null | undefined): string {
    if (!value) {
      return 'Not available';
    }

    const date = new Date(value);

    if (isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  formatDateTime(value: string | null | undefined): string {
    if (!value) {
      return 'Not available';
    }

    const date = new Date(value);

    if (isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }


  
goBack(): void {
  if (this.showDetails) {
    this.backToOrders();
  } else {
    window.history.back();
  }
}



private async showOrderToast(
  message: string,
  isSuccess: boolean
): Promise<void> {
  const toast = await this.toastController.create({
    message,
    duration: 3000,
    position: 'bottom',
    cssClass: 'diwali-toast',
    icon: isSuccess
      ? 'checkmark-circle-outline'
      : 'alert-circle-outline'
  });

  await toast.present();
}

}