import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { TakeSelfieComponent } from './sites/take-selfie/take-selfie.component';
import { CameraWindowComponent } from './components/camera-window/camera-window.component';
import { WebcamModule } from 'ngx-webcam';
import { CameraTriggerComponent } from './components/camera-trigger/camera-trigger.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { OpenCameraButtonComponent } from './components/open-camera-button/open-camera-button.component';
import { FlashComponent } from './components/flash/flash.component';
import { SelfieDisplayComponent } from './components/selfie-display/selfie-display.component';
import { RetakeSelfieButtonComponent } from './components/retake-selfie-button/retake-selfie-button.component';
import { SubmitSelfieComponent } from './components/submit-selfie/submit-selfie.component';
import { HttpClientModule } from '@angular/common/http';
import { NgxsModule } from '@ngxs/store';
import { AppState } from './store/app.state';
import { ConnectingComponent } from './sites/connecting/connecting.component';
import { RemoveBgCheckboxComponent } from './components/remove-bg-checkbox/remove-bg-checkbox.component';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { FormsModule } from '@angular/forms';
import { SharedModule } from './modules/shared/shared.module';
import { MatSnackBarModule } from '@angular/material/snack-bar';

@NgModule({
  declarations: [
    AppComponent,
    TakeSelfieComponent,
    CameraWindowComponent,
    CameraTriggerComponent,
    OpenCameraButtonComponent,
    FlashComponent,
    SelfieDisplayComponent,
    RetakeSelfieButtonComponent,
    SubmitSelfieComponent,
    ConnectingComponent,
    RemoveBgCheckboxComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    WebcamModule,
    FontAwesomeModule,
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    MatCheckboxModule,
    FormsModule,
    NgxsModule.forRoot([AppState]),
    SharedModule,
    MatSnackBarModule,
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
