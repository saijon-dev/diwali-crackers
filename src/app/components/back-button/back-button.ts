import { Component } from '@angular/core';

import {
  IonHeader,
  IonToolbar,
  IonButtons,
  IonBackButton
} from '@ionic/angular';

@Component({
  selector: 'app-back-button',

  standalone: true,

  templateUrl: './back-button.html',

  styleUrls: ['./back-button.scss'],

  imports: [
    IonHeader,
    IonToolbar,
    IonButtons,
    IonBackButton
  ]
})
export class BackButtonComponent {}