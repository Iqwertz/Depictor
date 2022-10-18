import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { CameraServiceService } from '../../services/camera-service.service';
import { environment } from '../../../environments/environment';
import { LoadingService } from '../../modules/shared/services/loading.service';
import { FileUploadService } from '../../services/file-upload.service';
import { SnackbarService } from '../../services/snackbar.service';
import { faCamera } from '@fortawesome/free-solid-svg-icons';
import { DeviceDetectorService } from 'ngx-device-detector';
import { BackendConnectService } from 'src/app/services/backend-connect.service';
import { ConverterConfig } from 'src/app/modules/shared/components/settings/settings.component';

@Component({
  selector: 'app-open-camera-button',
  templateUrl: './open-camera-button.component.html',
  styleUrls: ['./open-camera-button.component.scss'],
})
export class OpenCameraButtonComponent implements OnInit {
  constructor(
    public cameraService: CameraServiceService,
    private loadingService: LoadingService,
    private fileUploadService: FileUploadService,
    private deviceService: DeviceDetectorService,
    private backendConnectService: BackendConnectService
  ) {}

  @ViewChild('uploader') fileinput: any;

  @Input() skipImageUpload: boolean = false;

  faCamera = faCamera;

  ngOnInit(): void {}

  getButtonText(skipImageUpload: boolean): string {
    let buttonText: string = '';
    if (!skipImageUpload) {
      buttonText = this.deviceService.isMobile()
        ? 'Take a Selfie!'
        : 'Upload image or gcode';
    } else {
      buttonText = 'Generate Gcode';
    }

    return buttonText;
  }

  open() {
    console.log(this.skipImageUpload);
    if (this.skipImageUpload) {
      this.backendConnectService.sendImageConvertionRequst('', false);
      return;
    }
    if (environment.useCameraAPI) {
      this.cameraService.toggleCameraWindow();
    } else {
      this.loadingService.isLoading = true;
      this.loadingService.loadingText = 'uploading Image';
      this.fileinput.nativeElement.click();
    }
  }

  uploadFile($event: any) {
    this.loadingService.isLoading = false;
    this.fileUploadService.parseFile($event.target.files[0]);
  }
}
