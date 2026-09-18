import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonContent, IonIcon , IonBackButton} from '@ionic/angular';
import { addIcons } from 'ionicons';

import {
  addOutline,
  searchOutline,
  cartOutline,
  homeOutline,
  peopleOutline,
  receiptOutline,
  ellipsisHorizontalOutline,
  chevronForwardOutline,
  locationOutline
} from 'ionicons/icons';

interface Vendor {
  id: number;
  name: string;
  location: string;
  image: string;
  status: 'Active' | 'Inactive';
  products: number;
  orders: number;
}

@Component({
  selector: 'app-adm-vendors',
  standalone: true,
  templateUrl: './adm-vendors.page.html',
  styleUrls: ['./adm-vendors.page.scss'],
  imports: [
    IonContent,
    IonIcon,
    FormsModule,
    IonBackButton
  ]
})
export class AdmVendorsPage {

  searchText = '';
  selectedStatus: 'ALL' | 'Active' | 'Inactive' = 'ALL';

  vendors: Vendor[] = [
    {
      id: 1,
      name: 'Sri Venkateswara Crackers',
      location: 'Guntur',
      image: 'assets/images/rectangle-image.png',
      status: 'Active',
      products: 42,
      orders: 16
    },
    {
      id: 2,
      name: 'SVR Fireworks',
      location: 'Vijayawada',
      image: 'assets/images/rectangle-image.png',
      status: 'Active',
      products: 35,
      orders: 12
    },
    {
      id: 3,
      name: 'Andhra Crackers Mart',
      location: 'Visakhapatnam',
      image: 'assets/images/rectangle-image.png',
      status: 'Active',
      products: 28,
      orders: 9
    },
    {
      id: 4,
      name: 'Happy Diwali Stores',
      location: 'Tirupati',
      image: 'assets/images/rectangle-image.png',
      status: 'Inactive',
      products: 18,
      orders: 6
    }
  ];

  constructor(private router: Router) {

    addIcons({
      addOutline,
      searchOutline,
      cartOutline,
      homeOutline,
      peopleOutline,
      receiptOutline,
      ellipsisHorizontalOutline,
      chevronForwardOutline,
      locationOutline
    });
  }

  get filteredVendors(): Vendor[] {

    const search = this.searchText
      .trim()
      .toLowerCase();

    return this.vendors.filter(vendor => {

      const matchesSearch =
        vendor.name.toLowerCase().includes(search) ||
        vendor.location.toLowerCase().includes(search);

      const matchesStatus =
        this.selectedStatus === 'ALL' ||
        vendor.status === this.selectedStatus;

      return matchesSearch && matchesStatus;
    });
  }

  get allCount(): number {
    return this.vendors.length;
  }

  get activeCount(): number {
    return this.vendors.filter(
      vendor => vendor.status === 'Active'
    ).length;
  }

  get inactiveCount(): number {
    return this.vendors.filter(
      vendor => vendor.status === 'Inactive'
    ).length;
  }

  selectStatus(status: 'ALL' | 'Active' | 'Inactive'): void {
    this.selectedStatus = status;
  }


  goToHome(): void {
  this.router.navigate(['/tabs/adm-home']);
}

goToOrders(): void {
  this.router.navigate(['/tabs/adm-orders']);
}

goToProfile(): void {
  this.router.navigate(['/tabs/adm-profile']);
}

  addVendor(): void {
    this.router.navigate(['/tabs/adm-add-vendor']);
  }

  openVendor(vendor: Vendor): void {
    console.log('Selected Vendor:', vendor);
  }

  openMoreMenu(vendor: Vendor): void {
    console.log('Vendor menu:', vendor);
  }
}