import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { Select } from '@ngxs/store';
import { AppState } from '../../../store/app.state';
import { Settings } from '../../shared/components/settings/settings.component';
import { environment } from 'src/environments/environment';
import { GcodeFunctionsService } from './gcode-functions.service';

export interface StandartizerSettings {
  convertG0: boolean;
  removeUnusedParameter: boolean;
  transfromToPositiveSpace: boolean;
  scaleToDrawingArea: boolean;
  removeUnsupportedCommands: boolean;
  supportedCommands: string;
}

export type GcodeType =
  | 'generated'
  | 'gallery'
  | 'upload'
  | 'drawing'
  | 'stanCustom'
  | 'custom'; //Determins the type of the displayed gcode, used to adjust the ui

@Injectable({
  providedIn: 'root',
})
export class GcodeViewerService {
  maxLines: number = 0;
  gcodeFile: string = '';
  gcodeFileName: string = '';
  gcodeType: GcodeType = 'gallery';
  gcodeId: string = '';
  standardized: boolean = true;
  scaleToDrawingArea: boolean = true;
  settingsTransformationMatrix: number[][] = [
    [1, 0],
    [0, 1],
  ]; //Holds all transformation of the display rotation settings
  editorTransformationMatrix: number[][] = [
    [1, 0],
    [0, 1],
  ]; //Holds all transformations made in the editor
  gcodeArea: number[] = [0, 0];

  loading: boolean = false;

  $renderGcode: Subject<void> = new Subject<void>(); //emmited when new gcode is loaded
  $renderGcodeUpdate: Subject<void> = new Subject<void>(); //emmited when the gcode gets updated

  @Select(AppState.settings) settings$: any;
  settings: Settings = environment.defaultSettings;

  constructor(private gcodeFunctionsService: GcodeFunctionsService) {
    this.settings$.subscribe((settings: Settings) => {
      this.settings = settings;
    });
  }

  setGcodeFile(
    file: string,
    gcodeType: GcodeType,
    fileName: string | undefined
  ) {
    if (fileName) {
      this.gcodeFileName = fileName;
    } else {
      this.gcodeFileName = '';
    }
    this.gcodeType = gcodeType;
    this.gcodeFile = file;
    this.maxLines = this.gcodeFile.split(/\r?\n/).length - 1;
    console.log(this.maxLines);
    this.editorTransformationMatrix = [
      [1, 0],
      [0, 1],
    ];
    console.log('set gcode file');
    this.$renderGcode.next();
  }

  rotate(clockwise: boolean) {
    this.loading = true;
    setTimeout(() => {
      //This timeout is needed to prevent the UI from freezing
      let rotationMatrix = [
        [0, -1],
        [1, 0],
      ];
      if (!clockwise) {
        rotationMatrix = [
          [0, 1],
          [-1, 0],
        ];
      }

      //Matrix multiplication
      this.editorTransformationMatrix =
        this.gcodeFunctionsService.multiplyMatrix(
          rotationMatrix,
          this.editorTransformationMatrix
        );
      this.$renderGcodeUpdate.next();
      this.loading = false;
    }, 10);
  }

  mirror(axis: 'x' | 'y') {
    this.loading = true;
    setTimeout(() => {
      //This timeout is needed to prevent the UI from freezing
      let mirrorMatrix = [
        [1, 0],
        [0, 1],
      ];
      if (axis == 'x') {
        mirrorMatrix = [
          [-1, 0],
          [0, 1],
        ];
      } else if (axis == 'y') {
        mirrorMatrix = [
          [1, 0],
          [0, -1],
        ];
      }

      //Matrix multiplication
      this.editorTransformationMatrix =
        this.gcodeFunctionsService.multiplyMatrix(
          mirrorMatrix,
          this.editorTransformationMatrix
        );
      this.$renderGcodeUpdate.next();
      this.loading = false;
    }, 10);
  }

  /**
   *This function standartizes the gcode to make the gcode upload feature more reliable
   *  Cleanups:
   *    - All G0 Commands are converted to G1
   *    - Set X and Y position of all G1 commands
   *    - Lines beginnig with 'X' or 'Y' get appended with 'G1' (some gcode generators only genereate 'G1' for the first instruction)
   *    - Strip away Feedrates and Z coordinates
   *    - Remove G1 Commands without parameter
   *    - transform gcode to remove all negativ positions
   *    - remove start and end gcode
   *    - scale gcode to drawing area
   *    - remove comments
   *    - remove all commands that are not supported
   *
   * @param {string} gcode
   * @memberof CanvasGcodeRendererComponent
   */
  standartizeGcode(gcode: string): string {
    this.loading = true;
    let gcodeArray: string[] = gcode.split(/\r?\n/);

    let lastCommandParams: number[] = [0, 0];
    let biggestNegativ: number[] = [0, 0];
    let biggest: number[] = [0, 0];
    let lastG1Index: number = 0;
    const maxFloatingPoints: number = this.settings.floatingPoints;

    let settings: StandartizerSettings = this.settings.standardizerSettings;

    for (let i = 0; i < gcodeArray.length; i++) {
      //loop over every command and apply corrections
      let command = gcodeArray[i];

      command = command.split(';')[0]; //remove comments

      if (settings.convertG0) {
        if (command.startsWith('G00') || command.startsWith('G01')) {
          //replace all G0 commands with G1
          command = 'G1' + command.slice(3);
        }

        if (command.startsWith('G0')) {
          //replace all G0 commands with G1
          command = 'G1' + command.slice(2);
        }
      }

      if (settings.removeUnusedParameter) {
        if (command.startsWith('G1') && command.includes('F')) {
          //remive f values of G1 command
          command = command.split('F')[0];
        }

        if (command.startsWith('G1') && command.includes('Z')) {
          //remove z values of G1 command
          command = command.split('Z')[0];
        }
      }

      if (
        //remove empty G1 commands
        command.startsWith('G1') &&
        !(command.includes('X') || command.includes('Y'))
      ) {
        console.log(command);
        command = '';
      }

      if (command.startsWith('G1')) {
        //rebuild G1 command to ensure X and Y values
        let params = this.getG1Parameter(command, lastCommandParams);
        command = 'G1X' + params[0] + 'Y' + params[1];
      }

      if (command.startsWith('X') || command.startsWith('Y')) {
        //Add G1 to commands starting with X or Y
        let params = this.getG1Parameter(command, lastCommandParams);
        command = 'G1 X' + params[0] + 'Y' + params[1];
      }

      if (command.startsWith('G1')) {
        //When the command starts with G1 check for biggest negativ values (needed for the transform later)
        lastCommandParams = this.getG1Parameter(command, lastCommandParams);
        if (biggestNegativ[0] > lastCommandParams[0]) {
          biggestNegativ[0] = lastCommandParams[0];
        }
        if (biggestNegativ[1] > lastCommandParams[1]) {
          biggestNegativ[1] = lastCommandParams[1];
        }
        if (biggest[0] < lastCommandParams[0]) {
          biggest[0] = lastCommandParams[0];
        }
        if (biggest[1] < lastCommandParams[1]) {
          biggest[1] = lastCommandParams[1];
        }

        lastG1Index = i;
      }

      if (settings.removeUnsupportedCommands) {
        let supported: string[] = settings.supportedCommands.split(';');
        if (
          !this.gcodeFunctionsService.checkIfStringStartsWith(
            command,
            supported
          )
        ) {
          command = '';
        }
      }
      gcodeArray[i] = command;
    }

    let gcodeScaling = 1;

    if (settings.transfromToPositiveSpace) {
      biggest = [
        biggest[0] + Math.abs(biggestNegativ[0]),
        biggest[1] + Math.abs(biggestNegativ[1]),
      ]; //recalculate biggest number with shifted negativ
    }

    if (settings.scaleToDrawingArea) {
      //disabled scaling for custom uploads because it will get scaled again in the start draw process!
      //This led to wrong scaling calculations
      //so for now the scaleToDrawingArea parameter is only passed to the backendConnectService.uploadGcodeToGallery() function.
      /* let scalings: number[] = [
        this.settings.selectedPaperProfile.paperMax[0] / biggest[0],
        this.settings.selectedPaperProfile.paperMax[1] / biggest[1],
      ];

      if (scalings[0] < scalings[1]) {
        gcodeScaling = scalings[0];
      } else {
        gcodeScaling = scalings[1];
      }*/
    }

    let firstG1Found: boolean = false;
    for (let i = 0; i < gcodeArray.length; i++) {
      //loop over every command and transform it by the Negativ offset
      let command = gcodeArray[i];
      if (command.startsWith('G1')) {
        firstG1Found = true;
        let params = this.getG1Parameter(command, [0, 0]);
        //apply negativ offset
        if (settings.transfromToPositiveSpace) {
          params[0] += Math.abs(biggestNegativ[0]);
          params[1] += Math.abs(biggestNegativ[1]);
        }

        //apply scaling
        params[0] = params[0] * gcodeScaling;
        params[1] = params[1] * gcodeScaling;

        //round floating points
        params[0] = this.gcodeFunctionsService.round(
          params[0],
          maxFloatingPoints
        );
        params[1] = this.gcodeFunctionsService.round(
          params[1],
          maxFloatingPoints
        );

        gcodeArray[i] = 'G1X' + params[0] + 'Y' + params[1];
      }

      if (settings.removeUnsupportedCommands) {
        if (i > lastG1Index) {
          gcodeArray[i] = '';
        }
      }
    }

    gcodeArray = gcodeArray.filter(function (el) {
      return el != '';
    });
    console.log(gcodeArray);
    this.loading = false;
    return gcodeArray.join('\n');
  }

  private getG1Parameter(
    command: string,
    lastCommandParams: number[]
  ): number[] {
    let Xindex: number = command.indexOf('X');
    let Yindex: number = command.indexOf('Y');
    let x: number = 0;
    let y: number = 0;
    if (Xindex != -1) {
      x = parseFloat(
        command
          .substring(Xindex + 1, Yindex == -1 ? command.length : Yindex)
          .trim()
      );
    } else if (lastCommandParams) {
      x = lastCommandParams[0];
    }
    if (Yindex != -1) {
      y = parseFloat(command.substring(Yindex + 1, command.length).trim());
    } else if (lastCommandParams) {
      y = lastCommandParams[1];
    }
    return [x, y];
  }
}
