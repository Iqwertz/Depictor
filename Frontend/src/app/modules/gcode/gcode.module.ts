import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { GcodeRoutingModule } from './gcode-routing.module';
import { GcodeComponent } from './gcode.component';
import { MatSliderModule } from '@angular/material/slider';
import { FormsModule } from '@angular/forms';
import { StartDrawComponent } from './components/start-draw/start-draw.component';
import { GcodeEditComponent } from './sites/gcode-edit/gcode-edit.component';
import { DrawingProgressBarComponent } from './components/drawing-progress-bar/drawing-progress-bar.component';
import { DrawingComponent } from './sites/drawing/drawing.component';
import { CancleButtonComponent } from './components/cancle-button/cancle-button.component';
import { SelectLinesSliderComponent } from './components/select-lines-slider/select-lines-slider.component';
import { GalleryComponent } from './sites/gallery/gallery.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { SharedModule } from '../shared/shared.module';
import { DeleteButtonComponent } from './components/delete-button/delete-button.component';
import { StopDrawingButtonComponent } from './components/stop-drawing-button/stop-drawing-button.component';
import { CanvasGcodeRendererComponent } from './components/canvas-gcode-renderer/canvas-gcode-renderer.component';

@NgModule({
  declarations: [
    GcodeComponent,
    StartDrawComponent,
    GcodeEditComponent,
    DrawingComponent,
    DrawingProgressBarComponent,
    CancleButtonComponent,
    SelectLinesSliderComponent,
    GalleryComponent,
    DeleteButtonComponent,
    StopDrawingButtonComponent,
    CanvasGcodeRendererComponent,
  ],
  imports: [
    CommonModule,
    GcodeRoutingModule,
    MatSliderModule,
    FormsModule,
    FontAwesomeModule,
    SharedModule,
  ],
})
export class GcodeModule {}
