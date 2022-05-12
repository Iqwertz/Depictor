import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export type GcodeType = 'generated' | 'gallery' | 'upload' | 'drawing'; //Determins the type of the displayed gcode, used to adjust the ui

@Injectable({
  providedIn: 'root',
})
export class GcodeViewerService {
  maxLines: number = 0;
  gcodeFile: string = '';
  gcodeType: GcodeType = 'gallery';
  gcodeId: string = '';

  $renderGcode: Subject<void> = new Subject<void>();

  constructor() {}

  setGcodeFile(file: string, gcodeType: GcodeType) {
    this.gcodeType = gcodeType;
    this.gcodeFile = file;
    this.maxLines = this.gcodeFile.split(/\r?\n/).length;
    this.$renderGcode.next();
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
   *
   * @param {string} gcode
   * @memberof CanvasGcodeRendererComponent
   */
  standartizeGcode(gcode: string): string {
    let gcodeArray: string[] = gcode.split(/\r?\n/);
    let lastCommandParams: number[] = [0, 0];
    let biggestNegativ: number[] = [0, 0];
    let lastG1Index: number = 0;
    const scaleToDrawingArea: boolean = true;

    for (let i = 0; i < gcodeArray.length; i++) {
      //loop over every command and apply corrections
      let command = gcodeArray[i];
      if (command.startsWith('G0')) {
        //replace all G0 commands with G1
        command = 'G1' + command.slice(2);
      }

      if (command.startsWith('G1') && command.includes('F')) {
        //remive f values of G1 command
        command = command.split('F')[0];
      }

      if (command.startsWith('G1') && command.includes('Z')) {
        //remove z values of G1 command
        command = command.split('Z')[0];
      }

      if (
        //remove empty G1 commands
        command.startsWith('G1') &&
        !(command.includes('X') || command.includes('Y'))
      ) {
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

        lastG1Index = i;
      }

      gcodeArray[i] = command;
    }

    let firstG1Found: boolean = false;
    for (let i = 0; i < gcodeArray.length; i++) {
      //loop over every command and transform it by the Negativ offset
      let command = gcodeArray[i];
      if (command.startsWith('G1')) {
        firstG1Found = true;
        let params = this.getG1Parameter(command, [0, 0]);
        params[0] += Math.abs(biggestNegativ[0]);
        params[1] += Math.abs(biggestNegativ[1]);
        gcodeArray[i] = 'G1X' + params[0] + 'Y' + params[1];
      }
      if (!firstG1Found) {
        gcodeArray[i] = '';
      }

      if (i > lastG1Index) {
        gcodeArray[i] = '';
      }
    }

    gcodeArray = gcodeArray.filter(function (el) {
      return el != '';
    });

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
