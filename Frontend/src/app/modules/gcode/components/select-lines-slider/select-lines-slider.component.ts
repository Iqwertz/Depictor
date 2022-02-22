import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { GcodeViewerService } from '../../services/gcode-viewer.service';

@Component({
  selector: 'app-select-lines-slider',
  templateUrl: './select-lines-slider.component.html',
  styleUrls: ['./select-lines-slider.component.scss'],
})
export class SelectLinesSliderComponent implements OnInit {
  constructor(public gcodeViewerService: GcodeViewerService) {}

  notRenderdLines = 0;

  @Output() sliderUpdate = new EventEmitter<number>();
  @Input('timeEstimate') timeEstimate: number = 0;

  ngOnInit(): void {}

  sliderChanged() {
    this.sliderUpdate.emit(this.notRenderdLines);
    //this.gcodeViewerService.gcodeFileChanged = true;
  }

  formatTimeEstimate(seconds: number): string {
    let min: number = Math.floor((seconds / 60) % 60);
    let hours: number = Math.floor(seconds / 60 / 60);

    let res: string = '';

    if (hours > 0) {
      res += hours + 'h ';
    }
    res += min + 'min';

    return res;
  }
}
