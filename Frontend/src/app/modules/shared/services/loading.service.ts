import { Injectable } from '@angular/core';
import { AppStates } from '../../../services/site-state.service';

@Injectable({
  providedIn: 'root',
})
export class LoadingService {
  isLoading: boolean = false;
  loadingText: string = 'loading Background';

  serverResponseToLoadingText(response: AppStates) {
    switch (response) {
      case 'idle':
        this.loadingText = 'sleeping...';
        break;
      case 'processingImage':
        this.loadingText = 'converting image';
        break;
      case 'rawGcodeReady':
        this.loadingText = 'gcode ready';
        break;
      case 'removingBg':
        this.loadingText = ' removing background';
        break;
      default:
        this.loadingText = '';
        break;
    }
  }

  constructor() {}
}
