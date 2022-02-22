import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { Component, HostListener, OnInit } from '@angular/core';
import { CameraServiceService } from '../../services/camera-service.service';
import { faTimes } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-camera-window',
  templateUrl: './camera-window.component.html',
  styleUrls: ['./camera-window.component.scss'],
  animations: [
    trigger('openClose', [
      // ...
      state(
        'open',
        style({
          transform: 'scale(1)',
          opacity: 1,
        })
      ),
      state(
        'closed',
        style({
          transform: 'scale(0)',
          opacity: 0,
        })
      ),
      transition('open => closed', [animate('0.5s ease-in')]),
      transition('closed => open', [animate('0.5s ease-out')]),
    ]),
  ],
})
export class CameraWindowComponent implements OnInit {
  constructor(public cameraService: CameraServiceService) {}

  faClose = faTimes;

  screenWidth: number = window.innerWidth;
  screenHeight: number = window.innerHeight;

  isOpen = this.cameraService.showWebcam;

  toggle() {
    console.log('toggle');
    this.isOpen = !this.isOpen;
  }

  ngOnInit(): void {
    this.cameraService.toggleWindow.subscribe(() => {
      this.toggle();
    });
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.screenWidth = window.innerWidth;
    this.screenHeight = window.innerHeight;
  }

  onWindowAniDone(event: any) {
    if (!this.isOpen) {
      this.cameraService.showWebcam = false;
    }
  }

  onWindowAniStart(event: any) {
    if (this.isOpen) {
      this.cameraService.showWebcam = true;
    }
  }

  closeWindow() {
    this.cameraService.toggleCameraWindow();
  }
}
