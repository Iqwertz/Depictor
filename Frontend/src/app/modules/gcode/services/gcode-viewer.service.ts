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
}
