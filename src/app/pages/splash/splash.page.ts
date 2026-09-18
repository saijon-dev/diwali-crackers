import { Component } from '@angular/core';
import { IonContent } from '@ionic/angular';
import { Router } from '@angular/router';

@Component({
  selector: 'app-splash',
  templateUrl: './splash.page.html',
  styleUrls: ['./splash.page.scss'],
  standalone: true,
  imports: [
    IonContent
  ]
})
export class SplashPage {

  constructor(private router: Router) {}

  goToHome(): void {
    this.router.navigate(['/tabs/home']);
  }

}