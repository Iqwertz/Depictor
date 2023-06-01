import { AppComponent } from './../../../../app.component';
import {
  Component,
  OnInit,
  ViewChild,
  AfterViewInit,
  OnDestroy,
} from '@angular/core';
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
import { Subscription } from 'rxjs';

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
export class GcodeEditComponent implements OnInit, AfterViewInit, OnDestroy {
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
  renderGcodeSubscription: Subscription | null = null;
  loading: boolean = false;

  ngOnInit(): void {
    screen.orientation.lock('portrait');
    this.renderGcodeSubscription =
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

  ngOnDestroy() {
    this.renderGcodeSubscription?.unsubscribe();
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

    fullTransformation = this.fixMirrorTransform(fullTransformation);

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

    let strippedGcode: string = gcodeArray.slice(0, nr).join('\n');

    if (this.gcodeViewerService.gcodeType != 'custom') {
      let boundingBoxGcode = '';
      if (this.settings.traverseBoundingBox) {
        let standardFeedrate: number = this.getFeedrate(
          this.settings.startGcode
        );
        let offset = this.settings.selectedPaperProfile.drawingOffset;
        let max = this.settings.selectedPaperProfile.paperMax;
        let boundingBoxPoints: number[][] = [
          [offset[0], offset[1]],
          [offset[0], max[1]],
          [max[0], max[1]],
          [max[0], offset[1]],
          [offset[0], offset[1]],
        ];
        boundingBoxGcode += `F${this.settings.traverseBoundingBoxSpeed} \n`;
        boundingBoxPoints.forEach((point) => {
          boundingBoxGcode += `G1 X${point[0]} Y${point[1]} \n`;
        });
        if (standardFeedrate > 0) {
          boundingBoxGcode += `F${standardFeedrate} \n`;
        }
      }

      if (this.settings.enablePenChange) {
        strippedGcode = this.modifyForPenChange(strippedGcode);
      }

      strippedGcode =
        this.settings.startGcode +
        '\n' +
        boundingBoxGcode +
        strippedGcode +
        '\n' +
        this.settings.endGcode;
    }
    this.backendConnectService.postGcode(strippedGcode);
    this.loadingService.isLoading = false;
    this.router.navigate(['gcode', 'drawing']);
  }

  //returns the feedrate of the last line that contains a global feedrate command
  getFeedrate(gcode: string): number {
    let feedrate: number = -1;
    let gcodeArray: string[] = gcode.split('\n');
    gcodeArray.forEach((line) => {
      line = line.trim();
      if (line.startsWith('F')) {
        let feedrateString: string = line.replace(/[^\d.-]/g, ''); //remove all non numeric characters
        feedrate = parseInt(feedrateString);
      }
    });
    return feedrate;
  }

  fixMirrorTransform(matrix: number[][]): number[][] {
    let resultMatrix = matrix;
    //calculate the determinant of the matrix
    let determinant = matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0];
    if (determinant < 0) {
      //determinat is negative -> matrix was mirrored
      resultMatrix = this.gcodeFunctions.multiplyMatrix(
        //invert mirror
        [
          [-1, 0],
          [0, -1],
        ],
        matrix
      );
    }
    return resultMatrix;
  }

  modifyForPenChange(gcode: string): string {
    let gcodeArray: string[] = gcode.split('\n');
    let searchedAllLines: boolean = false; //need to it this way since the array is modified while iterating over it

    let i = 0;
    while (!searchedAllLines) {
      let line = gcodeArray[i];
      if (line.startsWith(this.settings.penChangeSettings.penChangeCommand)) {
        //insert pen change park command
        gcodeArray.splice(
          i,
          0,
          this.settings.penChangeSettings.penChangeParkGcode
        );
        i++;
        //insert pen change unpark command
        gcodeArray.splice(
          i + 1,
          0,
          this.settings.penChangeSettings.penChangeUnparkGcode
        );
        i++;
      }
      i++;
      if (i >= gcodeArray.length) {
        searchedAllLines = true;
      }
    }
    return gcodeArray.join('\n');
  }
}
