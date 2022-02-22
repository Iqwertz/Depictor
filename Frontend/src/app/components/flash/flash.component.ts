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
  selector: 'app-flash',
  templateUrl: './flash.component.html',
  styleUrls: ['./flash.component.scss'],
  animations: [
    trigger('showFlash', [
      // ...
      state(
        'set',
        style({
          opacity: 1,
          'z-index': 10,
        })
      ),
      state(
        'clear',
        style({
          opacity: 0,
          'z-index': -2,
        })
      ),
      transition('clear => set', [animate('0.02s')]),
      transition('set => clear', [animate('1s ease-out')]),
    ]),
  ],
})
export class FlashComponent implements OnInit {
  isFlash = false;

  constructor(private cameraService: CameraServiceService) {}

  ngOnInit(): void {
    this.cameraService.$setFlash.subscribe(() => {
      this.isFlash = true;
    });
  }

  onFlashDone(event: any): void {
    if (this.isFlash) {
      setTimeout(() => {
        this.isFlash = false;
      }, 200);
    }
  }
}
