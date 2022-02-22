import { Component, OnInit } from '@angular/core';
import { faCamera } from '@fortawesome/free-solid-svg-icons';
import { CameraServiceService } from '../../services/camera-service.service';

@Component({
  selector: 'app-camera-trigger',
  templateUrl: './camera-trigger.component.html',
  styleUrls: ['./camera-trigger.component.scss'],
})
export class CameraTriggerComponent implements OnInit {
  faCamera = faCamera;
  constructor(private cameraService: CameraServiceService) {}

  ngOnInit(): void {}

  triggerImage() {
    this.cameraService.triggerSnapshot();
    this.cameraService.setFlash();
    this.cameraService.toggleCameraWindow();
    setTimeout(() => {
      this.cameraService.minimizeSnapshot();
    }, 1500);
  }
}
