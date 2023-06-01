import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  Input,
  AfterViewInit,
} from '@angular/core';
import { Subject } from 'rxjs';
import { GcodeViewerService } from '../../services/gcode-viewer.service';
import { environment } from '../../../../../environments/environment';
import { AppState } from 'src/app/store/app.state';
import { Settings } from '../../../shared/components/settings/settings.component';
import { Select } from '@ngxs/store';
import { GcodeFunctionsService } from '../../services/gcode-functions.service';

export interface GcodeRendererConfigInput {
  strokeColor?: string;
  strokeColorPassive?: string;
  strokeWidth?: number;
  notRenderdLines?: number;
  gcodeScale?: number;
  drawing?: boolean;
}

export interface GcodeRendererConfig {
  strokeColor: string;
  strokeColorPassive: string;
  strokeWidth: number;
  notRenderdLines: number;
  gcodeScale: number;
  drawing: boolean;
}

@Component({
  selector: 'app-canvas-gcode-renderer',
  templateUrl: './canvas-gcode-renderer.component.html',
  styleUrls: ['./canvas-gcode-renderer.component.scss'],
})
export class CanvasGcodeRendererComponent implements OnInit, AfterViewInit {
  strokeColor = '#2E2E2E';
  drawingStrokeColor = '#9e9e9e';
  offset: number[] = [0, 0];
  lastDrawingCommand: string = '';
  lastDrawingPosition = 0;

  height: number = window.innerHeight - 250;
  width: number = window.innerWidth / 2;

  sketch: any;

  @Input('gcode') gcodeFile: string = '';

  @Input('config') rendererConfigInput: GcodeRendererConfigInput = {};

  progress: number = 0;

  rendererConfig: GcodeRendererConfig = {
    drawing: false,
    gcodeScale: 0,
    notRenderdLines: 0,
    strokeColor: '',
    strokeColorPassive: '',
    strokeWidth: 0,
  };

  constructor(
    private gcodeViewerService: GcodeViewerService,
    private gcodeFunctionService: GcodeFunctionsService
  ) {}

  @ViewChild('canvas')
  canvas: ElementRef<HTMLCanvasElement> | null = null;

  @Select(AppState.settings) settings$: any;
  settings: Settings = environment.defaultSettings;

  public ctx: CanvasRenderingContext2D | null = null;

  ngOnInit(): void {
    this.settings$.subscribe((settings: Settings) => {
      this.settings = settings;
    });
  }

  ngAfterViewInit(): void {
    if (!this.canvas) {
      return;
    }

    this.rendererConfig = {
      gcodeScale:
        this.rendererConfigInput.gcodeScale ||
        environment.gcodeRendererDefault.gcodeScale,
      notRenderdLines: this.rendererConfigInput.notRenderdLines || 0,
      strokeColor:
        this.rendererConfigInput.strokeColor ||
        environment.gcodeRendererDefault.strokeColor,
      strokeColorPassive:
        this.rendererConfigInput.strokeColorPassive ||
        environment.gcodeRendererDefault.strokeColorPassive,
      strokeWidth:
        this.rendererConfigInput.strokeWidth ||
        environment.gcodeRendererDefault.strokeWidth,
      drawing: this.rendererConfigInput.drawing || false,
    };

    this.height = window.innerHeight - 250;
    this.width = window.innerWidth / 2;
    if (window.innerWidth < 700) {
      window.innerHeight - 350;
      this.width = window.innerWidth - 20;
    }

    this.canvas.nativeElement.width = this.width;
    this.canvas.nativeElement.height = this.height;

    this.ctx = this.canvas!.nativeElement.getContext('2d');

    if (!this.ctx) {
      return;
    }

    this.ctx.fillStyle = '#fff';
    this.ctx.fillRect(0, 0, this.width, this.height);

    if (this.gcodeFile.length > 0) {
      this.render();
    }
  }

  renderGcode(file: string, config: GcodeRendererConfigInput) {
    let displayDefaultTransformationMatrix =
      this.gcodeFunctionService.generateTransformationMatrix(
        this.settings.displayDefaultTransform
      );

    let transformationMatrix = this.gcodeFunctionService.multiplyMatrix(
      this.gcodeViewerService.editorTransformationMatrix,
      displayDefaultTransformationMatrix
    );

    transformationMatrix = this.fixMirrorTransform(transformationMatrix);

    /*     console.log('generated (render)');
    console.log(gcodeDefaultTransformationMatrix);
    console.log('editor (render)');
    console.log(this.gcodeViewerService.editorTransformationMatrix);
    console.log('full (render)');
    console.log(transformationMatrix); */

    this.gcodeFile = this.transformGcode(file, transformationMatrix);

    this.rendererConfig = {
      gcodeScale:
        config.gcodeScale || environment.gcodeRendererDefault.gcodeScale,
      notRenderdLines: config.notRenderdLines || 0,
      strokeColor:
        config.strokeColor || environment.gcodeRendererDefault.strokeColor,
      strokeColorPassive:
        config.strokeColorPassive ||
        environment.gcodeRendererDefault.strokeColorPassive,
      strokeWidth:
        config.strokeWidth || environment.gcodeRendererDefault.strokeWidth,
      drawing: config.drawing || false,
    };

    this.render();
  }

  updateDrawingGcode(prog: number) {
    this.progress = prog;
    if (this.progress > this.lastDrawingPosition) {
      let commands: string[] = this.gcodeFile.split(/\r?\n/);
      let snippet = commands.slice(this.lastDrawingPosition, this.progress);
      if (snippet[snippet.length - 1].startsWith('G')) {
        this.drawGcode(
          snippet.join('\n'),
          this.rendererConfig.gcodeScale,
          this.rendererConfig.strokeColor,
          this.rendererConfig.notRenderdLines,
          this.offset,
          false,
          true,
          this.lastDrawingCommand
        );

        this.lastDrawingCommand = snippet[snippet.length - 1];
        this.lastDrawingPosition = this.progress;
      }
    }
  }

  render() {
    if (!this.canvas) {
      return;
    }

    console.log('render');

    //   scales the gcode to fit window and centers it
    let boundingValues = this.gcodeFunctionService.getBiggestValues(
      this.gcodeFile
    );
    this.gcodeViewerService.gcodeArea = boundingValues[1];

    let smallestValues = boundingValues[0];
    this.gcodeFile = this.gcodeFunctionService
      .applyOffset(this.gcodeFile.split(/\r?\n/), [
        smallestValues[0] * -1,
        smallestValues[1] * -1,
      ])
      .join('\n');

    let biggestValues = boundingValues[1];
    let bounds: number[] = [
      biggestValues[0] - smallestValues[0],
      biggestValues[1] - smallestValues[1],
    ];
    /*     bounds[0] += Math.abs(biggestValues[0][0]);
    bounds[1] += Math.abs(biggestValues[0][1]); */

    this.offset = [0, 0];

    if (
      this.canvas.nativeElement.width / this.canvas.nativeElement.height <
      bounds[0] / bounds[1]
    ) {
      //can be optimized when called only once per new gcode file (not at any change)
      this.rendererConfig.gcodeScale =
        this.canvas.nativeElement.width / bounds[0];
      this.offset[1] =
        (this.canvas.nativeElement.height -
          bounds[1] * this.rendererConfig.gcodeScale) /
        2;
    } else {
      this.rendererConfig.gcodeScale =
        this.canvas.nativeElement.height / bounds[1];
      this.offset[0] =
        (this.canvas.nativeElement.width -
          bounds[0] * this.rendererConfig.gcodeScale) /
        2;
    }

    let color: string = this.rendererConfig.strokeColor;
    if (this.rendererConfig.drawing) {
      color = this.rendererConfig.strokeColorPassive;
    }

    //renders gcode
    this.drawGcode(
      this.gcodeFile,
      this.rendererConfig.gcodeScale,
      color,
      this.rendererConfig.notRenderdLines,
      this.offset,
      true,
      !this.gcodeViewerService.standardized,
      null
    );
  }

  drawGcode(
    gcode: string,
    scale: number,
    c: any,
    notRenderdLines: number,
    offset: number[],
    clear: boolean,
    ignorePen: boolean,
    startCommand: string | null
  ) {
    if (clear) {
      this.clearCanvas();
    }

    if (!this.ctx) {
      return;
    }

    this.ctx.strokeStyle = c;

    let commands: string[] = gcode.split(/\r?\n/);

    let isPenDown: boolean = false;

    let lastCommandParameter: number[] = [0, 0];

    if (startCommand) {
      lastCommandParameter = this.getG1Parameter(startCommand);
    }

    let renderedLines = commands.length - notRenderdLines;
    if (renderedLines <= 0) {
      renderedLines = 0;
    }
    this.ctx.beginPath();
    for (let i = 0; i < renderedLines; i++) {
      let command: string = commands[i];
      if (command.startsWith(';')) {
        continue;
      }
      if (
        command.startsWith('G1') ||
        command.startsWith('G0') ||
        command.startsWith('X') ||
        command.startsWith('Y')
      ) {
        let parameter: number[] = this.getG1Parameter(command);
        if (isPenDown || ignorePen) {
          this.ctx.moveTo(
            lastCommandParameter[0] * scale + offset[0],
            lastCommandParameter[1] * scale + offset[1]
          );
          this.ctx.lineTo(
            parameter[0] * scale + offset[0],
            parameter[1] * scale + offset[1]
          );
        }
        lastCommandParameter = parameter;
      } else if (
        command.startsWith('M05') ||
        command.startsWith('M5') ||
        command == this.settings.penUpCommand
      ) {
        isPenDown = false;
      } else if (
        command.startsWith('M03') ||
        command.startsWith('M3') ||
        command == this.settings.penDownCommand
      ) {
        isPenDown = true;
      } else if (
        command.startsWith(this.settings.penChangeSettings.penChangeCommand) &&
        this.settings.enablePenChange
      ) {
        this.ctx.stroke();
        let color = command.split(' ')[1];
        console.log(color);
        this.ctx.beginPath();
        this.ctx.strokeStyle = color;
      } else {
        console.log(command);
      }
    }
    this.ctx.stroke();

    /*     console.log(this.canvas?.nativeElement.toDataURL('image/png'));

    let t = this.canvas?.nativeElement.toDataURL('image/png');
    if (t) {
      const link = document.createElement('a');
      link.href = t;
      link.download = 'img.png';
      link.click();
    } */
  }

  private clearCanvas() {
    if (!this.ctx) {
      return;
    }
    const canvas: HTMLCanvasElement = this.ctx.canvas;
    this.ctx.save();
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.ctx.restore();
    this.ctx.fillStyle = '#fff';
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  transformGcode(gcode: string, transformationMatrix: number[][]): string {
    let bounds: number[] = this.gcodeFunctionService.getBiggestValues(gcode)[1];
    let gcodeArray: string[] = gcode.split('\n');

    gcodeArray = this.gcodeFunctionService.applyTransformation(
      gcodeArray,
      transformationMatrix,
      [bounds[0] / 2, bounds[1] / 2]
    );

    return gcodeArray.join('\n');
  }

  getG1Parameter(command: string): number[] {
    let Xindex: number = command.indexOf('X');
    let Yindex: number = command.indexOf('Y');
    let x: number = 0;
    let y: number = 0;
    x = parseFloat(
      command.substring(Xindex + 1, command.lastIndexOf('Y')).trim()
    );
    y = parseFloat(command.substring(Yindex + 1, command.length).trim());
    return [x, y];
  }

  /*
  THis is a really sketchy fix but the code structure doesnt allow me to do this with a pure lin alg transfromation_
  The Problem is that when the display is rotated the mirror function is also rotated and therefore doesnt accurately display what the buttons suggest.
  THis cant be fixed earlier since it only is a display error and not a gcode transform error.
  The only solution other than this would be to keep an array of all transformations that were done and then invert the mirror transforms. But this would require a complete redesign of the transformation code
  (And maybe there is some fancy math that can be done to fix this but I was at the beginning of university when I wrote this :))

  Okay so now it works and I dont know why but dont touch it
  */
  fixMirrorTransform(matrix: number[][]): number[][] {
    let resultMatrix = matrix;
    //calculate the determinant of the matrix
    let determinant = matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0];
    if (determinant < 0) {
      //determinat is negative -> matrix was mirrored
      resultMatrix = this.gcodeFunctionService.multiplyMatrix(
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

  captureScreenshot(): string | undefined {
    if (!this.canvas) {
      return undefined;
    }

    this.height = 500;
    this.width = 380;
    this.canvas.nativeElement.width = this.width;
    this.canvas.nativeElement.height = this.height;

    this.ctx = this.canvas!.nativeElement.getContext('2d');

    if (!this.ctx) {
      return;
    }

    this.ctx.fillStyle = '#fff';
    this.ctx.fillRect(0, 0, this.width, this.height);

    this.render();

    return this.canvas?.nativeElement.toDataURL('image/png');
  }
}
