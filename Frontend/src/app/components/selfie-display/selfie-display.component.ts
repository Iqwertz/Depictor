import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { Component, OnInit } from '@angular/core';
import { CameraServiceService } from '../../services/camera-service.service';

@Component({
  selector: 'app-selfie-display',
  templateUrl: './selfie-display.component.html',
  styleUrls: ['./selfie-display.component.scss'],
  animations: [
    trigger('resizeSelfie', [
      state(
        'big',
        style({
          'border-radius': 0,
          height: 'calc(100vh - 20px)',
        })
      ),
      state(
        'small',
        style({
          'border-radius': 15,
          height: '50vh',
        })
      ),
      transition('big => small', [animate('0.5s ease-out')]),
    ]),
  ],
})
export class SelfieDisplayComponent implements OnInit {
  constructor(public cameraService: CameraServiceService) {}

  isBig = true;

  ngOnInit(): void {
    this.cameraService.$miniSnapshot.subscribe(() => {
      this.isBig = false;
    });
  }
}
