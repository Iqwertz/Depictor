import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TakeSelfieComponent } from './sites/take-selfie/take-selfie.component';
import { ConnectingComponent } from './sites/connecting/connecting.component';

const routes: Routes = [
  {
    path: '',
    component: ConnectingComponent,
  },
  {
    path: 'start',
    component: TakeSelfieComponent,
  },

  {
    path: 'gcode',
    loadChildren: () =>
      import('./modules/gcode/gcode.module').then((m) => m.GcodeModule),
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })],
  exports: [RouterModule],
})
export class AppRoutingModule {}
