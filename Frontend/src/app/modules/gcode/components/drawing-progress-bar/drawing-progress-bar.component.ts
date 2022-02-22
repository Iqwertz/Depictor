import { Component, OnInit, Input } from '@angular/core';
import { GcodeViewerService } from '../../services/gcode-viewer.service';
import { environment } from '../../../../../environments/environment';
import { Select } from '@ngxs/store';
import { AppState } from '../../../../store/app.state';
import { Settings } from '../../../shared/components/settings/settings.component';

@Component({
  selector: 'app-drawing-progress-bar',
  templateUrl: './drawing-progress-bar.component.html',
  styleUrls: ['./drawing-progress-bar.component.scss'],
})
export class DrawingProgressBarComponent implements OnInit {
  constructor(public gcodeViewerService: GcodeViewerService) {
    this.settings$.subscribe((settings: Settings) => {
      this.settings = settings;
    });
  }

  ngOnInit(): void {}

  @Input('progress') progress: number = 0;

  @Select(AppState.settings) settings$: any;
  settings: Settings = environment.defaultSettings;

  calcProgressInPercent(prog: number, max: number): number {
    return Math.round((prog * 100) / max);
  }

  calcRemainingTime(prog: number, max: number): string {
    let seconds = (max - prog) * this.settings.avgTimePerLine;
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
