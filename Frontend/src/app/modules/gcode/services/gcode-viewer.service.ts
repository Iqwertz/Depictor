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
   *    - Lines beginnig with 'X' or 'Y' get appended with 'G1' (some gcode generators only genereate 'G1' for the first instruction)
   *    - Strip away Feedrates and Z coordinates
   *    - Remove G1 Commands without parameter
   *    - transform gcode to remove all negativ positions
   *
   * @param {string} gcode
   * @memberof CanvasGcodeRendererComponent
   */
  standartizeGcode(gcode: string): string {
    let gcodeArray: string[] = gcode.split(/\r?\n/);
    let lastCommandParams: number[] = [0, 0];
    let biggestNegativ: number[] = [0, 0];

    for (let i = 0; i < gcodeArray.length; i++) {
      //loop over every command and apply corrections
      let command = gcodeArray[i];
      if (command.startsWith('G0')) {
        command = 'G1' + command.slice(2);
      }

      if (command.startsWith('G1') && command.includes('F')) {
        command = command.split('F')[0];
      }

      if (command.startsWith('G1') && command.includes('Z')) {
        command = command.split('Z')[0];
      }

      if (
        command.startsWith('G1') &&
        !(command.includes('X') || command.includes('Y'))
      ) {
        command = '';
      }

      if (command.startsWith('X') || command.startsWith('Y')) {
        let params = this.getG1Parameter(command, lastCommandParams);
        command = 'G1 X' + params[0] + 'Y' + params[1];
      }

      if (command.startsWith('G1')) {
        lastCommandParams = this.getG1Parameter(command, lastCommandParams);
        if (biggestNegativ[0] > lastCommandParams[0]) {
          biggestNegativ[0] = lastCommandParams[0];
        }
        if (biggestNegativ[1] > lastCommandParams[1]) {
          biggestNegativ[1] = lastCommandParams[1];
        }
      }

      gcodeArray[i] = command;
    }

    for (let i = 0; i < gcodeArray.length; i++) {
      //loop over every command and transform it by the Negativ offset
      let command = gcodeArray[i];
      if (command.startsWith('G1')) {
        let params = this.getG1Parameter(command, [0, 0]);
        params[0] += Math.abs(biggestNegativ[0]);
        params[1] += Math.abs(biggestNegativ[1]);
        gcodeArray[i] = 'G1X' + params[0] + 'Y' + params[1];
      }
    }

    console.log(biggestNegativ);

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
