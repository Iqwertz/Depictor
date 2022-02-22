import { Component, OnInit } from '@angular/core';
import { faRedo } from '@fortawesome/free-solid-svg-icons';
import { CameraServiceService } from '../../services/camera-service.service';

@Component({
  selector: 'app-retake-selfie-button',
  templateUrl: './retake-selfie-button.component.html',
  styleUrls: ['./retake-selfie-button.component.scss'],
})
export class RetakeSelfieButtonComponent implements OnInit {
  faRedo = faRedo;

  constructor(private cameraService: CameraServiceService) {}

  ngOnInit(): void {}

  retake() {
    this.cameraService.webcamImage = null;
    this.cameraService.base64Image = null;
    this.cameraService.toggleCameraWindow();
  }
}
