import { Injectable } from '@angular/core';
import { WebcamUtil, WebcamInitError, WebcamImage } from 'ngx-webcam';
import { Subject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CameraServiceService {
  // toggle webcam on/off
  public showWebcam = false;
  public allowCameraSwitch = true;
  public multipleWebcamsAvailable = false;
  public deviceId: string = '';
  public errors: WebcamInitError[] = [];

  // latest snapshot
  public webcamImage: WebcamImage | null = null;
  public base64Image: string | null = null;

  // webcam snapshot trigger
  private trigger: Subject<void> = new Subject<void>();
  // switch to next / previous / specific webcam; true/false: forward/backwards, string: deviceId
  private nextWebcam: Subject<boolean | string> = new Subject<
    boolean | string
  >();

  toggleWindow: Subject<void> = new Subject<void>();

  $setFlash: Subject<void> = new Subject<void>();

  $miniSnapshot: Subject<void> = new Subject<void>();

  constructor() {
    WebcamUtil.getAvailableVideoInputs().then(
      (mediaDevices: MediaDeviceInfo[]) => {
        this.multipleWebcamsAvailable = mediaDevices && mediaDevices.length > 1;
      }
    );
  }

  public setFlash(): void {
    this.$setFlash.next();
  }

  public minimizeSnapshot(): void {
    this.$miniSnapshot.next();
  }

  public toggleCameraWindow(): void {
    this.toggleWindow.next();
  }

  public triggerSnapshot(): void {
    this.trigger.next();
  }

  public toggleWebcam(): void {
    this.showWebcam = !this.showWebcam;
  }

  public handleInitError(error: WebcamInitError): void {
    this.errors.push(error);
  }

  public showNextWebcam(directionOrDeviceId: boolean | string): void {
    // true => move forward through devices
    // false => move backwards through devices
    // string => move to device with given deviceId
    this.nextWebcam.next(directionOrDeviceId);
  }

  public handleImage(webcamImage: WebcamImage): void {
    console.info('received webcam image', webcamImage);
    this.webcamImage = webcamImage;
    this.base64Image = webcamImage.imageAsDataUrl;
  }

  public cameraWasSwitched(deviceId: string): void {
    console.log('active device: ' + deviceId);
    this.deviceId = deviceId;
  }

  public get triggerObservable(): Observable<void> {
    return this.trigger.asObservable();
  }

  public get nextWebcamObservable(): Observable<boolean | string> {
    return this.nextWebcam.asObservable();
  }
}
