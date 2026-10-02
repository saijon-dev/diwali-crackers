import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular';
import { NavigationLoaderComponent } from './components/navigation-loader/navigation-loader.component';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet,    NavigationLoaderComponent],
})
export class AppComponent {
  constructor() {}
}
