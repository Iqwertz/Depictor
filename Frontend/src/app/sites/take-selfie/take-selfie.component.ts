import { Component, OnInit } from '@angular/core';
import { environment } from 'src/environments/environment';
import { CameraServiceService } from '../../services/camera-service.service';
import { SiteStateService } from '../../services/site-state.service';
import { BackendConnectService } from '../../services/backend-connect.service';
import { Store } from '@ngxs/store';
import { SetAutoRouting } from '../../store/app.action';

@Component({
  templateUrl: './take-selfie.component.html',
  styleUrls: ['./take-selfie.component.scss'],
})
export class TakeSelfieComponent implements OnInit {
  constructor(
    public cameraService: CameraServiceService,
    private connectService: BackendConnectService,
    private store: Store,
    private siteStateService: SiteStateService
  ) {}

  enableCameraAPI: boolean = environment.useCameraAPI;

  removeBg: boolean = false;

  setRBG(val: boolean) {
    this.removeBg = val;
  }

  postSelfie() {
    this.connectService.postSelfie(this.removeBg);
  }

  ngOnInit(): void {
    this.cameraService.base64Image = null;
    this.cameraService.webcamImage = null;
    this.store.dispatch(new SetAutoRouting(true));
  }
}
