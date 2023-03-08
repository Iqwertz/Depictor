import { Injectable } from '@angular/core';
import { CameraServiceService } from './camera-service.service';
import imageCompression from 'browser-image-compression';
import { environment } from '../../environments/environment';
import { LoadingService } from '../modules/shared/services/loading.service';
import { AppState } from '../store/app.state';
import { Select, Store } from '@ngxs/store';
import {
  ConverterConfig,
  Settings,
} from '../modules/shared/components/settings/settings.component';
import { SnackbarService } from './snackbar.service';
import { GcodeViewerService } from '../modules/gcode/services/gcode-viewer.service';
import { Router } from '@angular/router';
import { SetAutoRouting } from '../store/app.action';
import { BackendConnectService } from './backend-connect.service';

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
    private store: Store,
    private backendConnectService: BackendConnectService
  ) {
    this.settings$.subscribe((settings: Settings) => {
      this.settings = settings;
    });
  }

  parseFile(file: File, config: ConverterConfig) {
    this.loadingService.isLoading = true;
    this.loadingService.loadingText = 'processing File';
    let fileType = file.name.split('.').pop();
    if (!fileType) {
      this.snackbarService.error('File has no file ending. Cant process file.');
      return;
    }
    console.log(fileType);
    console.log(config.acceptedFiletypes);
    if (fileType == 'nc' || fileType == 'gcode') {
      this.parseGcodeUpload(file, config);
    } else if (config.acceptedFiletypes.includes(fileType)) {
      if (this.isFileImage(file)) {
        console.log('image');
        this.parseImageUpload(file, config);
      } else {
        console.log('file');
        this.parseFileUpload(file, config);
      }
    } else {
      if (this.settings.autoSelectConverter) {
        for (let converter of this.settings.converter.availableConverter) {
          if (converter.acceptedFiletypes.includes(fileType.toLowerCase())) {
            config = converter;
            this.snackbarService.notification(
              'Auto selected ' + config.name + ' converter!'
            );
            this.parseFile(file, config);
            return;
          }
        }
        this.snackbarService.error(
          'File type is not supported by any converter module!'
        );
      } else {
        this.snackbarService.error(
          'The selected converter module doesnt support this file type!'
        );
      }
    }
  }

  private parseGcodeUpload(file: File, config: ConverterConfig) {
    this.blobToText(file).then((result: string | ArrayBuffer | null) => {
      if (typeof result === 'string') {
        this.gcodeViewerService.gcodeId = '';
        this.gcodeViewerService.standardized = this.settings.standardizeGcode;
        this.gcodeViewerService.scaleToDrawingArea =
          this.settings.standardizerSettings.scaleToDrawingArea;
        let gcode = '';
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
        this.loadingService.isLoading = false;
        this.router.navigate(['gcode', 'editGcode']);
      }
    });
  }

  private parseImageUpload(file: File, config: ConverterConfig) {
    if (!this.isFileImage(file)) {
      this.snackbarService.error('Error: File is not an Image');
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
                this.setUploadedImage(b64, config);
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

  private parseFileUpload(file: File, config: ConverterConfig) {
    console.log(file.name);
    if (config.isBinary) {
      this.blobToBase64(file).then((result: string | ArrayBuffer | null) => {
        if (typeof result === 'string') {
          this.loadingService.isLoading = true;
          this.loadingService.loadingText = 'uploading image';
          this.backendConnectService.sendFileConvertionRequst(result, config);
        } else {
          this.snackbarService.error(
            'There was an error when uploading the file'
          );
        }
      });
    } else {
      this.blobToText(file).then((result: string | ArrayBuffer | null) => {
        if (typeof result === 'string') {
          this.loadingService.isLoading = true;
          this.loadingService.loadingText = 'uploading image';
          this.backendConnectService.sendFileConvertionRequst(result, config);
        } else {
          this.snackbarService.error(
            'There was an error when uploading the file'
          );
        }
      });
    }
  }

  private isFileImage(file: File) {
    return (
      file &&
      file['type'].split('/')[0] === 'image' &&
      file.name.split('.').pop() !== 'svg'
    );
  }

  setUploadedImage(b64Data: string, config: ConverterConfig) {
    this.cameraService.base64Image = b64Data;
    this.cameraService.setFlash();
    this.cameraService.toggleCameraWindow();
    this.cameraService.converterConfig = config;
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
