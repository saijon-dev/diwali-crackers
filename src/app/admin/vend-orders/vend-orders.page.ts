import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular';

@Component({
  selector: 'app-vend-orders',
  templateUrl: './vend-orders.page.html',
  styleUrls: ['./vend-orders.page.scss'],
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class VendOrdersPage implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
