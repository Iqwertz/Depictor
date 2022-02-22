import { Component } from '@angular/core';
import { SiteStateService } from './services/site-state.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'Depictor';
  constructor(private siteStateService: SiteStateService) {}
}
