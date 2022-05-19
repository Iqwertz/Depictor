import { Injectable } from '@angular/core';
import { CameraServiceService } from './camera-service.service';
import imageCompression from 'browser-image-compression';
import { environment } from '../../environments/environment';
import { LoadingService } from '../modules/shared/services/loading.service';
import { AppState } from '../store/app.state';
import { Select, Store } from '@ngxs/store';
import { Settings } from '../modules/shared/components/settings/settings.component';
import { SnackbarService } from './snackbar.service';
import { GcodeViewerService } from '../modules/gcode/services/gcode-viewer.service';
import { Router } from '@angular/router';
import { SetAutoRouting } from '../store/app.action';

@Injectable({
  providedIn: 'root',
})
export class FileUploadService {
  @Select(AppState.settings) settings$: any;
  settings: Settings = environment.defaultSettings;

  constructor(
    private cameraService: CameraServiceService,
    private loadingService: LoadingService,
    private snackbarService: SnackbarService,
    private gcodeViewerService: GcodeViewerService,
    private router: Router,
    private store: Store
  ) {
    this.settings$.subscribe((settings: Settings) => {
      this.settings = settings;
    });
  }

  parseFile(file: File) {
    let fileType = file.name.split('.').pop();
    if (fileType == 'nc' || fileType == 'gcode') {
      this.parseGcodeUpload(file);
    } else if (this.isFileImage(file)) {
      this.parseImageUpload(file);
    } else {
      this.snackbarService.error('Error: Filetype is not supported');
    }
  }

  private parseGcodeUpload(file: File) {
    this.blobToText(file).then((result: string | ArrayBuffer | null) => {
      if (typeof result === 'string') {
        this.gcodeViewerService.gcodeId = '';
        this.gcodeViewerService.standardized = this.settings.standardizeGcode;
        let gcode = '';
        console.log(this.settings.standardizeGcode);
        if (this.settings.standardizeGcode) {
          gcode = this.gcodeViewerService.standartizeGcode(result);
        } else {
          gcode = result;
        }
        this.gcodeViewerService.setGcodeFile(
          gcode,
          'upload',
          file.name.split('.')[0]
        );
        this.store.dispatch(new SetAutoRouting(false));
        this.router.navigate(['gcode', 'editGcode']);
      }
    });
  }

  private parseImageUpload(file: File) {
    if (!this.isFileImage(file)) {
      this.snackbarService.error('Error: Filetype is not supported');
      return;
    }

    this.blobToBase64(file).then((result: string | ArrayBuffer | null) => {
      if (typeof result === 'string') {
        this.loadingService.isLoading = true;
        this.loadingService.loadingText = 'compressing image';
        imageCompression
          .getFilefromDataUrl(result, 'upload.jpg')
          .then((file: File) => {
            imageCompression(file, {
              maxSizeMB: this.settings.maxImageFileSize,
            }).then((file: File) => {
              imageCompression.getDataUrlFromFile(file).then((b64: string) => {
                this.loadingService.isLoading = false;
                this.loadingService.loadingText = '';
                this.setUploadedImage(b64);
              });
            });
          });
      } else {
        this.snackbarService.error(
          'There was an error when uploading the image'
        );
      }
    });
  }

  private isFileImage(file: File) {
    return file && file['type'].split('/')[0] === 'image';
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

  private blobToText(blob: Blob) {
    return new Promise<string | ArrayBuffer | null>((resolve, _) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsText(blob);
    });
  }
}
