import { Injectable } from '@angular/core';
import { CameraServiceService } from './camera-service.service';
import imageCompression from 'browser-image-compression';
import { environment } from '../../environments/environment';
import { LoadingService } from '../modules/shared/services/loading.service';
import { AppState } from '../store/app.state';
import { Select } from '@ngxs/store';
import { Settings } from '../modules/shared/components/settings/settings.component';

@Injectable({
  providedIn: 'root',
})
export class FileUploadService {
  @Select(AppState.settings) settings$: any;
  settings: Settings = environment.defaultSettings;

  constructor(
    private cameraService: CameraServiceService,
    private loadingService: LoadingService
  ) {
    this.settings$.subscribe((settings: Settings) => {
      this.settings = settings;
    });
  }

  parseImageUpload($event: any) {
    this.blobToBase64($event.target.files[0]).then(
      (result: string | ArrayBuffer | null) => {
        if (typeof result === 'string') {
          this.loadingService.isLoading = true;
          this.loadingService.loadingText = 'compressing image';
          imageCompression
            .getFilefromDataUrl(result, 'upload.jpg')
            .then((file: File) => {
              imageCompression(file, {
                maxSizeMB: this.settings.maxImageFileSize,
              }).then((file: File) => {
                imageCompression
                  .getDataUrlFromFile(file)
                  .then((b64: string) => {
                    this.loadingService.isLoading = false;
                    this.loadingService.loadingText = '';
                    this.setUploadedImage(b64);
                  });
              });
            });
        }
      }
    );
  }

  setUploadedImage(b64Data: string) {
    this.cameraService.base64Image = b64Data;
    this.cameraService.setFlash();
    this.cameraService.toggleCameraWindow();
    setTimeout(() => {
      this.cameraService.minimizeSnapshot();
    }, 1500);
  }

  private blobToBase64(blob: Blob) {
    return new Promise<string | ArrayBuffer | null>((resolve, _) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  }
}
