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
    let screenshot = this.renderer?.captureScreenshot();
    if (!screenshot) {
      this.loadingService.isLoading = false;
      this.snackbarService.error('Error: Couldn`t generate preview Image');
      return;
    }
    this.backendConnectService.uploadGcodeToGallery(
      screenshot,
      this.gcodeViewerService.gcodeFile,
      redirect
    );
  }

  startDraw() {
    this.store.dispatch(new SetAutoRouting(true));

    if (this.gcodeViewerService.gcodeType == 'upload') {
      this.upload(false);
    }
    let serverGcode: string = this.gcodeViewerService.gcodeFile;
    let gcodeArray: string[] = serverGcode.split('\n');

    gcodeArray = this.replacePenDownCommand(gcodeArray);
    gcodeArray = this.scaleGcode(gcodeArray, this.settings.gcodeScale);
    let nr = this.notRenderdLines * -1;
    if (nr == 0) {
      nr = -1;
    }

    ///////////////////remove the first 6 lines of the gcode and replace them with the start gcode after join -> not clean at all but currently to lazy to recompile java
    if (this.gcodeViewerService.gcodeType != 'upload') {
      gcodeArray.splice(0, 6);
    }
    let strippedGcode: string = gcodeArray.slice(0, nr).join('\n');
    strippedGcode = this.applyOffset(
      strippedGcode,
      this.settings.drawingOffset
    );
    strippedGcode = this.settings.startGcode + '\n' + strippedGcode;
    strippedGcode += this.settings.endGcode;
    this.backendConnectService.postGcode(strippedGcode);
    this.router.navigate(['gcode', 'drawing']);
  }

  replacePenDownCommand(gcode: string[]): string[] {
    for (let i = 0; i < gcode.length; i++) {
      if (gcode[i].includes('M03')) {
        gcode[i] = this.settings.penDownCommand;
      }
    }
    return gcode;
  }

  scaleGcode(gcode: string[], scale: number): string[] {
    for (let i = 0; i < gcode.length; i++) {
      let command = gcode[i];
      if (command.startsWith('G1')) {
        let parameter = this.getG1Parameter(command);
        parameter[0] = parameter[0] * scale;
        parameter[1] = parameter[1] * scale;
        gcode[i] = 'G1 X' + parameter[0] + 'Y' + parameter[1];
      }
    }
    return gcode;
  }

  applyOffset(gcode: string, offset: number[]): string {
    let gcodeArray: string[] = gcode.split('\n');

    for (let i = 0; i < gcodeArray.length; i++) {
      let command = gcodeArray[i];
      if (command.startsWith('G1')) {
        let parameter = this.getG1Parameter(command);
        parameter[0] += offset[0];
        parameter[1] += offset[1];
        gcodeArray[i] = 'G1 X' + parameter[0] + 'Y' + parameter[1];
      }
    }

    return gcodeArray.join('\n');
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
}
