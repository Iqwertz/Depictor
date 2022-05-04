import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CameraServiceService } from '../../services/camera-service.service';
import { environment } from '../../../environments/environment';
import { LoadingService } from '../../modules/shared/services/loading.service';
import { FileUploadService } from '../../services/file-upload.service';
import { SnackbarService } from '../../services/snackbar.service';
import { faCamera } from '@fortawesome/free-solid-svg-icons';
import { DeviceDetectorService } from 'ngx-device-detector';

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
    private deviceService: DeviceDetectorService
  ) {}

  @ViewChild('uploader') fileinput: any;

  faCamera = faCamera;
  buttonText:string = ""

  ngOnInit(): void {
    this.buttonText = this.deviceService.isMobile() ? 'Take a Selfie!' : 'Upload image or gcode';
  }

  open() {
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
    this.fileUploadService.parseImageUpload($event.target.files[0]);
  }
}
