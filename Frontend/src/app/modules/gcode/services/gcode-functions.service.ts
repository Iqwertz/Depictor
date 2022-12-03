import { Injectable } from '@angular/core';
import { Select } from '@ngxs/store';
import { AppState } from 'src/app/store/app.state';
import { environment } from 'src/environments/environment.prod';
import { Settings } from '../../shared/components/settings/settings.component';

@Injectable({
  providedIn: 'root',
})
export class GcodeFunctionsService {
  @Select(AppState.settings) settings$: any;
  settings: Settings = environment.defaultSettings;

  constructor() {
    this.settings$.subscribe((settings: Settings) => {
      this.settings = settings;
    });
  }

  replacePenCommands(
    gcode: string[],
    penDown: string,
    penUp: string
  ): string[] {
    for (let i = 0; i < gcode.length; i++) {
      if (gcode[i].includes('M03') || gcode[i].includes('M3')) {
        gcode[i] = penDown;
      } else if (gcode[i].includes('M05') || gcode[i].includes('M5')) {
        gcode[i] = penUp;
      }
    }
    return gcode;
  }

  scaleGcode(
    gcode: string[],
    center: Boolean,
    drawingOffset: number[],
    paperMax: number[]
  ): string[] {
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
      (paperMax[0] - drawingOffset[0]) / biggest[0],
      (paperMax[1] - drawingOffset[1]) / biggest[1],
    ];

    if (scalings[0] < scalings[1]) {
      gcodeScaling = scalings[0];
      if (center) {
        centeringOffset[1] =
          (paperMax[1] - drawingOffset[1] - biggest[1] * gcodeScaling) / 2;
      }
    } else {
      gcodeScaling = scalings[1];
      if (center) {
        centeringOffset[0] =
          (paperMax[0] - drawingOffset[0] - biggest[0] * gcodeScaling) / 2;
      }
    }

    for (let i = 0; i < gcode.length; i++) {
      let command = gcode[i];
      if (
        command.startsWith('G1') ||
        command.startsWith('G01') ||
        command.startsWith('G0')
      ) {
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

  applyTransformation(
    gcodeArray: string[],
    transformMationMatrix: number[][],
    centerPoint: number[]
  ) {
    let center = [centerPoint[0] / 2, centerPoint[1] / 2];

    for (let i = 0; i < gcodeArray.length; i++) {
      let command = gcodeArray[i];
      if (command.startsWith('G1')) {
        let parameter = this.getG1Parameter(command);

        //Move gcode center to origin for rotation operations
        parameter[0] -= center[0];
        parameter[1] -= center[1];

        //Apply transformation matrix
        let x =
          parameter[0] * transformMationMatrix[0][0] +
          parameter[1] * transformMationMatrix[0][1];
        let y =
          parameter[0] * transformMationMatrix[1][0] +
          parameter[1] * transformMationMatrix[1][1];

        //Move gcode back to center
        x += center[0];
        y += center[1];

        //round floating points
        x = this.round(x, this.settings.floatingPoints);
        y = this.round(y, this.settings.floatingPoints);

        gcodeArray[i] = 'G1 X' + x + 'Y' + y;
      }
    }

    return gcodeArray;
  }

  // from: https://stackoverflow.com/questions/11832914/how-to-round-to-at-most-2-decimal-places-if-necessary
  round = (n: number, dp: number) => {
    const h = +'1'.padEnd(dp + 1, '0'); // 10 or 100 or 1000 or etc
    return Math.round(n * h) / h;
  };

  // from: https://stackoverflow.com/questions/67866641/check-if-a-string-starts-with-any-of-the-strings-in-an-array
  checkIfStringStartsWith(str: string, substrs: string[]) {
    return substrs.some((substr) => str.startsWith(substr));
  }
}
