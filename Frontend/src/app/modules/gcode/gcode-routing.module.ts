import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GcodeComponent } from './gcode.component';
import { GcodeEditComponent } from './sites/gcode-edit/gcode-edit.component';
import { DrawingComponent } from './sites/drawing/drawing.component';
import { GalleryComponent } from './sites/gallery/gallery.component';

const routes: Routes = [
  {
    path: '',
    component: GcodeComponent,
    children: [
      {
        path: 'editGcode',
        component: GcodeEditComponent,
      },
      {
        path: 'drawing',
        component: DrawingComponent,
      },
      {
        path: 'gallery',
        component: GalleryComponent,
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class GcodeRoutingModule {}
