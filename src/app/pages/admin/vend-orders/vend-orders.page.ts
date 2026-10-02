import {
  ChangeDetectorRef,
  Component
} from '@angular/core';

import { FormsModule } from '@angular/forms';

import {
  IonContent,
  IonIcon,
  IonButton,
  IonSelect,
  IonSelectOption,
  IonInput,
  IonBackButton
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
    IonBackButton
  ]
})
export class VendOrdersPage {




  pendingStatus: VendorOrderStatus | '' = '';
statusUpdateComplete = false;

deliveryOtpDigits: string[] = ['', '', '', '', '', ''];
isVerifyingOtp = false;
otpErrorMessage = '';
otpSuccessMessage = '';

  currentView: OrderView = 'new';

  newOrders: VendorOrder[] = [];
  confirmedOrders: VendorOrder[] = [];

  selectedOrder: VendorOrder | null = null;
  showDetails = false;

  isLoading = false;
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
    private readonly cdr: ChangeDetectorRef
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
    this.isLoading = true;
    this.errorMessage = '';

    this.vendorOrderService.getReceivedOrders(0, 10).subscribe({
      next: (response) => {
        this.newOrders = response?.content ?? [];
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('GET VENDOR RECEIVED ORDERS ERROR:', error);

        this.newOrders = [];
        this.isLoading = false;
        this.errorMessage = 'Unable to load new orders.';
        this.cdr.detectChanges();
      }
    });
  }

  loadConfirmedOrders(): void {
    this.vendorOrderService.getConfirmedOrders(0, 10).subscribe({
      next: (response) => {
        this.confirmedOrders = response?.content ?? [];
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('GET VENDOR CONFIRMED ORDERS ERROR:', error);

        this.confirmedOrders = [];
        this.cdr.detectChanges();
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

          this.successMessage = `Order #${order.orderId} confirmed.`;

          this.loadConfirmedOrders();
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('CONFIRM VENDOR ORDER ERROR:', error);

          this.confirmingOrderId = null;
          this.errorMessage = 'Unable to confirm this order. Please try again.';
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

saveStatusOrBack(): void {
  if (!this.selectedOrder) {
    return;
  }

  if (this.statusUpdateComplete) {
    this.backToOrders();
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
        this.statusUpdateComplete = true;
        this.successMessage =
          `Order #${order.orderId} updated to ${this.formatStatus(status)}.`;

        if (status === 'CONFIRMED') {
          this.newOrders = this.newOrders.filter(
            item => item.orderId !== order.orderId
          );
        }

        this.loadConfirmedOrders();
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('UPDATE VENDOR ORDER STATUS ERROR:', error);

        this.updatingStatusOrderId = null;
        this.errorMessage =
          'Unable to update the order status. Please try again.';
        this.cdr.detectChanges();
      }
    });
}

/* ====================================================
   OTP INPUT
==================================================== */

onOtpInput(value: string | number | null | undefined, index: number): void {
  const digit = String(value ?? '').replace(/\D/g, '').slice(-1);
  this.deliveryOtpDigits[index] = digit;
  this.otpErrorMessage = '';
}

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
    this.otpErrorMessage = 'Please enter the complete 6-digit OTP.';
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

  this.vendorOrderService.verifyDeliveryOtp(
    order.orderId,
    order.customerMobile,
    otp,
    order.orderStoreId
  ).subscribe({
    next: () => {
      this.isVerifyingOtp = false;
      this.otpSuccessMessage = 'Delivery OTP verified successfully.';
      this.cdr.detectChanges();
    },
    error: (error) => {
      console.error('DELIVERY OTP VERIFICATION ERROR:', error);

      this.isVerifyingOtp = false;
      this.otpErrorMessage =
        'Unable to verify the OTP. Please check it and try again.';
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
}