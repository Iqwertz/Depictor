import { AppComponent } from './../../../../app.component';
import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { GcodeViewerService } from '../../services/gcode-viewer.service';
import { SiteStateService } from '../../../../services/site-state.service';
import { BackendConnectService } from '../../../../services/backend-connect.service';
import { environment } from 'src/environments/environment';
import { Store, Select } from '@ngxs/store';
import { SetAutoRouting } from '../../../../store/app.action';
import { Router } from '@angular/router';
import { CanvasGcodeRendererComponent } from '../../components/canvas-gcode-renderer/canvas-gcode-renderer.component';
import { AppState } from '../../../../store/app.state';
import { Settings } from '../../../shared/components/settings/settings.component';
import { SnackbarService } from '../../../../services/snackbar.service';
import { LoadingService } from '../../../shared/services/loading.service';

export interface GalleryEntryUpload {
  name?: string;
  gcode: string;
  preview: string;
  standardized: boolean;
  scale: boolean;
}

@Component({
  templateUrl: './gcode-edit.component.html',
  styleUrls: ['./gcode-edit.component.scss'],
})
export class GcodeEditComponent implements OnInit, AfterViewInit {
  constructor(
    public gcodeViewerService: GcodeViewerService,
    private backendConnectService: BackendConnectService,
    private siteStateService: SiteStateService,
    private store: Store,
    private router: Router,
    private snackbarService: SnackbarService,
    private loadingService: LoadingService
  ) {}

  @ViewChild(CanvasGcodeRendererComponent) renderer:
    | CanvasGcodeRendererComponent
    | undefined;

  @Select(AppState.settings) settings$: any;
  settings: Settings = environment.defaultSettings;

  notRenderdLines: number = 0;
  estimatedSeconds: number = 0;

  ngOnInit(): void {
    screen.orientation.lock('portrait');

    this.gcodeViewerService.$renderGcode.subscribe(() => {
      this.renderer?.renderGcode(this.gcodeViewerService.gcodeFile, {
        notRenderdLines: 0,
      });
      this.estimatedSeconds =
        this.gcodeViewerService.maxLines * this.settings.avgTimePerLine;

      console.log(this.estimatedSeconds);
    });

    this.settings$.subscribe((settings: Settings) => {
      this.settings = settings;
    });
  }

  ngAfterViewInit() {
    this.renderer?.renderGcode(this.gcodeViewerService.gcodeFile, {
      notRenderdLines: 0,
    });
    this.estimatedSeconds =
      this.gcodeViewerService.maxLines * this.settings.avgTimePerLine;
  }

  sliderUpdated(nRL: number) {
    this.renderer?.renderGcode(this.gcodeViewerService.gcodeFile, {
      notRenderdLines: nRL,
    });

    this.estimatedSeconds =
      (this.gcodeViewerService.maxLines - nRL) * this.settings.avgTimePerLine;
    this.notRenderdLines = nRL;
  }

  upload(redirect: boolean) {
    this.loadingService.isLoading = true;
    this.loadingService.loadingText = 'uploading gcode';
    let prevNRL = this.notRenderdLines;
    this.sliderUpdated(0);
    let screenshot = this.renderer?.captureScreenshot();
    this.notRenderdLines = prevNRL;
    this.sliderUpdated(this.notRenderdLines);
    if (!screenshot) {
      this.loadingService.isLoading = false;
      this.snackbarService.error('Error: Couldn`t generate preview Image');
      return;
    }

    let uploadData: GalleryEntryUpload = {
      gcode: this.gcodeViewerService.gcodeFile,
      preview: screenshot,
      standardized: this.gcodeViewerService.standardized,
      scale: this.gcodeViewerService.scaleToDrawingArea,
    };

    this.backendConnectService.uploadGcodeToGallery(uploadData, redirect);
  }

  startDraw() {
    this.loadingService.isLoading = true;
    this.loadingService.loadingText = 'sending Gcode';
    this.store.dispatch(new SetAutoRouting(true));
    if (this.gcodeViewerService.gcodeType == 'upload') {
      this.upload(false);
    }
    let serverGcode: string = this.gcodeViewerService.gcodeFile;
    let gcodeArray: string[] = serverGcode.split('\n');

    if (this.gcodeViewerService.gcodeType != 'custom') {
      gcodeArray = this.replacePenCommands(gcodeArray);
      if (this.gcodeViewerService.scaleToDrawingArea) {
        gcodeArray = this.scaleGcode(
          gcodeArray,
          this.settings.centerOnDrawingArea
        );
      }
      gcodeArray = this.applyOffset(
        gcodeArray,
        this.settings.selectedPaperProfile.drawingOffset
      );
    }

    let nr = this.notRenderdLines * -1;
    if (nr == 0) {
      nr = -1;
      gcodeArray.push('');
    }

    ///////////////////remove the first 6 lines of the gcode and replace them with the start gcode after join -> not clean at all but currently to lazy to recompile java
    /*     if (
      this.gcodeViewerService.gcodeType != 'stanCustom' &&
      this.gcodeViewerService.gcodeType != 'custom'
    ) {
      gcodeArray.splice(0, 6);
    } */
    let strippedGcode: string = gcodeArray.slice(0, nr).join('\n');

    if (this.gcodeViewerService.gcodeType != 'custom') {
      strippedGcode = this.settings.startGcode + '\n' + strippedGcode + '\n';
      strippedGcode += this.settings.endGcode;
    }

    this.backendConnectService.postGcode(strippedGcode);
    this.loadingService.isLoading = false;
    this.router.navigate(['gcode', 'drawing']);
  }

  replacePenCommands(gcode: string[]): string[] {
    for (let i = 0; i < gcode.length; i++) {
      if (gcode[i].includes('M03') || gcode[i].includes('M3')) {
        gcode[i] = this.settings.penDownCommand;
      } else if (gcode[i].includes('M05') || gcode[i].includes('M5')) {
        gcode[i] = this.settings.penUpCommand;
      }
    }
    return gcode;
  }

  scaleGcode(gcode: string[], center: Boolean): string[] {
    let gcodeScaling = 1;
    let biggest: number[] = [0, 0];
    let centeringOffset: number[] = [0, 0];

    gcode = this.moveToOrigin(gcode);

    for (let i = 0; i < gcode.length; i++) {
      let cmd = this.getG1Parameter(gcode[i]);
      if (biggest[0] < cmd[0]) {
        biggest[0] = cmd[0];
      }
      if (biggest[1] < cmd[1]) {
        biggest[1] = cmd[1];
      }
    }

    let scalings: number[] = [
      (this.settings.selectedPaperProfile.paperMax[0] -
        this.settings.selectedPaperProfile.drawingOffset[0]) /
        biggest[0],
      (this.settings.selectedPaperProfile.paperMax[1] -
        this.settings.selectedPaperProfile.drawingOffset[1]) /
        biggest[1],
    ];

    if (scalings[0] < scalings[1]) {
      gcodeScaling = scalings[0];
      if (center) {
        centeringOffset[1] =
          (this.settings.selectedPaperProfile.paperMax[1] -
            this.settings.selectedPaperProfile.drawingOffset[1] -
            biggest[1] * gcodeScaling) /
          2;
      }
    } else {
      gcodeScaling = scalings[1];
      if (center) {
        centeringOffset[0] =
          (this.settings.selectedPaperProfile.paperMax[0] -
            this.settings.selectedPaperProfile.drawingOffset[0] -
            biggest[0] * gcodeScaling) /
          2;
      }
    }

    for (let i = 0; i < gcode.length; i++) {
      let command = gcode[i];
      if (command.startsWith('G1')) {
        let parameter = this.getG1Parameter(command);
        parameter[0] = parameter[0] * gcodeScaling + centeringOffset[0];
        parameter[1] = parameter[1] * gcodeScaling + centeringOffset[1];

        //round floating points
        parameter[0] = this.round(parameter[0], this.settings.floatingPoints);
        parameter[1] = this.round(parameter[1], this.settings.floatingPoints);
        gcode[i] = 'G1 X' + parameter[0] + 'Y' + parameter[1];
      }
    }
    return gcode;
  }

  //moves the gcode to the origing by substracting the smallest x,y value from all x,y values
  moveToOrigin(gcode: string[]): string[] {
    let smallest: number[] = [-1, -1];

    for (let i = 0; i < gcode.length; i++) {
      if (gcode[i].startsWith('G1')) {
        let cmd = this.getG1Parameter(gcode[i]);
        if (smallest[0] == -1) {
          smallest[0] = cmd[0];
          smallest[1] = cmd[1];
        } else {
          if (smallest[0] > cmd[0]) {
            smallest[0] = cmd[0];
          }
          if (smallest[1] > cmd[1]) {
            smallest[1] = cmd[1];
          }
        }
      }
    }

    for (let i = 0; i < gcode.length; i++) {
      let command = gcode[i];
      if (command.startsWith('G1')) {
        let parameter = this.getG1Parameter(command);
        parameter[0] = parameter[0] - smallest[0];
        parameter[1] = parameter[1] - smallest[1];

        gcode[i] = 'G1 X' + parameter[0] + 'Y' + parameter[1];
      }
    }

    return gcode;
  }

  applyOffset(gcodeArray: string[], offset: number[]): string[] {
    for (let i = 0; i < gcodeArray.length; i++) {
      let command = gcodeArray[i];
      if (command.startsWith('G1')) {
        let parameter = this.getG1Parameter(command);
        parameter[0] += offset[0];
        parameter[1] += offset[1];

        //round floating points
        parameter[0] = this.round(parameter[0], this.settings.floatingPoints);
        parameter[1] = this.round(parameter[1], this.settings.floatingPoints);

        gcodeArray[i] = 'G1 X' + parameter[0] + 'Y' + parameter[1];
      }
    }

    return gcodeArray;
  }

  getG1Parameter(command: string): number[] {
    let x: number = parseFloat(
      command
        .substring(command.indexOf('X') + 1, command.lastIndexOf('Y'))
        .trim()
    );
    let y: number = parseFloat(
      command.substring(command.indexOf('Y') + 1, command.length).trim()
    );
    return [x, y];
  }

  // from: https://stackoverflow.com/questions/11832914/how-to-round-to-at-most-2-decimal-places-if-necessary
  private round = (n: number, dp: number) => {
    const h = +'1'.padEnd(dp + 1, '0'); // 10 or 100 or 1000 or etc
    return Math.round(n * h) / h;
  };
}
