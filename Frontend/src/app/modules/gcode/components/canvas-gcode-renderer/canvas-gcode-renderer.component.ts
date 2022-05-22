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

  constructor(private gcodeViewerService: GcodeViewerService) {}

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
    this.gcodeFile = this.transformGcode(
      file,
      this.settings.gcodeDisplayTransform
    );

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

    //   scales the gcode to fit window and centers it
    let biggestValues = this.getBiggestValues(this.gcodeFile);
    let bounds: number[] = biggestValues[1];
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

  getBiggestValues(gcode: string): number[][] {
    //determins the farthest cordinates
    let commands: string[] = gcode.split(/\r?\n/);
    let biggest: number[] = [0, 0];
    let smallest: number[] = [0, 0];
    for (let cmd of commands) {
      let cords: number[] = this.getG1Parameter(cmd);
      if (cords[0] > biggest[0]) {
        biggest[0] = cords[0];
      }
      if (cords[1] > biggest[1]) {
        biggest[1] = cords[1];
      }

      if (cords[0] < smallest[0]) {
        smallest[0] = cords[0];
      }
      if (cords[1] < smallest[1]) {
        smallest[1] = cords[1];
      }
    }
    return [smallest, biggest];
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
      } else if (command.startsWith('M05') || command.startsWith('M5')) {
        isPenDown = false;
      } else if (command.startsWith('M03') || command.startsWith('M3')) {
        isPenDown = true;
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

  transformGcode(gcode: string, transform: boolean[]): string {
    let bounds: number[] = [];
    if (transform[1] || transform[2]) {
      //only calculate the biggest gcode value when needed
      bounds = this.getBiggestValues(gcode)[1];
    }

    let gcodeArray: string[] = gcode.split('\n');
    for (let i = 0; i < gcodeArray.length; i++) {
      let command = gcodeArray[i];
      if (command.startsWith('G1')) {
        let parameter = this.getG1Parameter(command);

        if (transform[1]) {
          //invert x
          parameter[0] = bounds[0] / 2 + (bounds[0] / 2 - parameter[0]);
        }

        if (transform[2]) {
          //invert y
          parameter[1] = bounds[1] / 2 + (bounds[1] / 2 - parameter[1]);
        }

        if (transform[0]) {
          //switch x and y
          let temp = parameter[0];
          parameter[0] = parameter[1];
          parameter[1] = temp;
        }

        gcodeArray[i] = 'G1 X' + parameter[0] + 'Y' + parameter[1];
      }
    }

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

  captureScreenshot(): string | undefined {
    return this.canvas?.nativeElement.toDataURL('image/png');
  }
}
