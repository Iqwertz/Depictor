import { Component, OnInit } from '@angular/core';
import {
  faArrowsAltH,
  faArrowsAltV,
  faRotateRight,
} from '@fortawesome/free-solid-svg-icons';
import { GcodeFunctionsService } from '../../services/gcode-functions.service';
import { GcodeViewerService } from '../../services/gcode-viewer.service';

@Component({
  selector: 'app-transform-buttons',
  templateUrl: './transform-buttons.component.html',
  styleUrls: ['./transform-buttons.component.scss'],
})
export class TransformButtonsComponent implements OnInit {
  faRotate = faRotateRight;
  faArrowsAltV = faArrowsAltV;
  faArrowsAltH = faArrowsAltH;

  constructor(private gcodeViewerService: GcodeViewerService) {}

  ngOnInit(): void {}

  rotate() {
    this.gcodeViewerService.rotate(true);
  }

  mirrorX() {
    this.gcodeViewerService.mirror('x');
  }

  mirrorY() {
    this.gcodeViewerService.mirror('y');
  }
}
