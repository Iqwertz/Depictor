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
import { GcodeFunctionsService } from '../../services/gcode-functions.service';

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
    private loadingService: LoadingService,
    private gcodeFunctions: GcodeFunctionsService
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
      console.log('rendering gcode');
      this.renderer?.renderGcode(this.gcodeViewerService.gcodeFile, {
        notRenderdLines: 0,
      });
      this.estimatedSeconds =
        this.gcodeViewerService.maxLines * this.settings.avgTimePerLine;
    });

    this.gcodeViewerService.$renderGcodeUpdate.subscribe(() => {
      console.log('render update');
      this.renderer?.renderGcode(this.gcodeViewerService.gcodeFile, {
        notRenderdLines: this.notRenderdLines,
      });
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

    let fullTransformation = this.gcodeFunctions.multiplyMatrix(
      this.gcodeViewerService.editorTransformationMatrix,
      this.gcodeFunctions.generateTransformationMatrix(
        this.settings.gcodeDefaultTransform
      )
    );

    console.log('Generated:');
    console.log(
      this.gcodeFunctions.generateTransformationMatrix(
        this.settings.gcodeDefaultTransform
      )
    );
    console.log('Editor:');
    console.log(this.gcodeViewerService.editorTransformationMatrix);
    console.log('Full:');
    console.log(fullTransformation);

    gcodeArray = this.gcodeFunctions.applyTransformation(
      gcodeArray,
      fullTransformation
    );

    serverGcode = gcodeArray.join('\n');

    if (this.gcodeViewerService.gcodeType != 'custom') {
      gcodeArray = this.gcodeFunctions.replacePenCommands(
        gcodeArray,
        this.settings.penDownCommand,
        this.settings.penUpCommand
      );
      if (this.gcodeViewerService.scaleToDrawingArea) {
        gcodeArray = this.gcodeFunctions.scaleGcode(
          gcodeArray,
          this.settings.centerOnDrawingArea,
          this.settings.selectedPaperProfile.drawingOffset,
          this.settings.selectedPaperProfile.paperMax
        );
      }
      gcodeArray = this.gcodeFunctions.applyOffset(
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
}
