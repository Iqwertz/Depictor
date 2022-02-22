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

export interface GcodeRendererConfigInput {
  strokeColor?: string;
  strokeColorPassive?: string;
  strokeWidth?: number;
  notRenderdLines?: number;
  gcodeScale?: number;
  drawing?: boolean;
  drawingOffset?: number[];
}

export interface GcodeRendererConfig {
  strokeColor: string;
  strokeColorPassive: string;
  strokeWidth: number;
  notRenderdLines: number;
  gcodeScale: number;
  drawing: boolean;
  drawingOffset: number[];
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

  bounds: number[] = [];

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
    drawingOffset: [0, 0],
  };

  constructor(private gcodeViewerService: GcodeViewerService) {}

  @ViewChild('canvas')
  canvas: ElementRef<HTMLCanvasElement> | null = null;

  public ctx: CanvasRenderingContext2D | null = null;

  ngOnInit(): void {}

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
      drawingOffset:
        this.rendererConfigInput.drawingOffset ||
        environment.gcodeRendererDefault.drawingOffset,
    };

    this.height = window.innerHeight - 250;
    this.width = window.innerWidth / 2;
    if (window.innerWidth < 700) {
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
    this.gcodeFile = file;
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
      drawingOffset:
        config.drawingOffset || environment.gcodeRendererDefault.drawingOffset,
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
    this.bounds = this.getBiggestValue(this.gcodeFile);

    this.offset = [0, 0];

    if (
      this.canvas.nativeElement.width / this.canvas.nativeElement.height <
      this.bounds[0] / this.bounds[1]
    ) {
      //can be optimized when called only once per new gcode file (not at any change)
      this.rendererConfig.gcodeScale =
        this.canvas.nativeElement.width / this.bounds[0];
      this.offset[1] =
        (this.canvas.nativeElement.height -
          this.bounds[1] * this.rendererConfig.gcodeScale) /
        2;
    } else {
      this.rendererConfig.gcodeScale =
        this.canvas.nativeElement.height / this.bounds[1];
      this.offset[0] =
        (this.canvas.nativeElement.width -
          this.bounds[0] * this.rendererConfig.gcodeScale) /
        2;
    }

    this.offset[0] +=
      this.rendererConfig.drawingOffset[0] *
      (this.rendererConfig.gcodeScale / 2);
    this.offset[1] +=
      this.rendererConfig.drawingOffset[1] *
      (this.rendererConfig.gcodeScale / 2);

    let color: string = this.rendererConfig.strokeColor;
    if (this.rendererConfig.drawing) {
      color = this.rendererConfig.strokeColorPassive;
    }

    console.log(this.rendererConfig);

    //renders gcode
    this.drawGcode(
      this.gcodeFile,
      this.rendererConfig.gcodeScale,
      color,
      this.rendererConfig.notRenderdLines,
      this.offset,
      true,
      false,
      null
    );
  }

  getBiggestValue(gcode: string): number[] {
    //determins the farthest cordinates
    let commands: string[] = gcode.split(/\r?\n/);
    let biggest: number[] = [0, 0];
    for (let cmd of commands) {
      let cords: number[] = this.getG1Parameter(cmd);
      if (cords[0] > biggest[0]) {
        biggest[0] = cords[0];
      }
      if (cords[1] > biggest[1]) {
        biggest[1] = cords[1];
      }
    }

    return biggest;
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

      if (command.startsWith('G1')) {
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
