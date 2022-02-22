import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class GcodeViewerService {
  maxLines: number = 0;
  gcodeFile: string = '';
  isGeneratedGcode: boolean = false; //determins if the current gcode was freshly generated (to enable cancle action or not)
  gcodeId: string = '';

  $renderGcode: Subject<void> = new Subject<void>();

  constructor() {}

  setGcodeFile(file: string, generated: boolean) {
    this.isGeneratedGcode = generated;
    this.gcodeFile = file;
    this.maxLines = this.gcodeFile.split(/\r?\n/).length;
    this.$renderGcode.next();
  }
}
