import { Component, OnInit } from '@angular/core';
import { environment } from 'src/environments/environment';
import { CameraServiceService } from '../../services/camera-service.service';
import { SiteStateService } from '../../services/site-state.service';
import { BackendConnectService } from '../../services/backend-connect.service';
import { Select, Store } from '@ngxs/store';
import { SetAutoRouting, SetSettings } from '../../store/app.action';
import { LoadingService } from '../../modules/shared/services/loading.service';
import { AppState } from 'src/app/store/app.state';
import {
  ConverterConfig,
  ConverterSettings,
  Settings,
} from 'src/app/modules/shared/components/settings/settings.component';

@Component({
  templateUrl: './take-selfie.component.html',
  styleUrls: ['./take-selfie.component.scss'],
})
export class TakeSelfieComponent implements OnInit {
  constructor(
    public cameraService: CameraServiceService,
    private connectService: BackendConnectService,
    private store: Store,
    public siteStateService: SiteStateService,
    private loadingService: LoadingService,
    private backendConnectService: BackendConnectService
  ) {}

  @Select(AppState.settings) settings$: any;
  settings: Settings = JSON.parse(JSON.stringify(environment.defaultSettings));
  settingsLoaded: boolean = false;

  enableCameraAPI: boolean = environment.useCameraAPI;

  removeBg: boolean = false;

  converterOptions: string[] = [];

  setRBG(val: boolean) {
    this.removeBg = val;
  }

  postSelfie() {
    this.connectService.sendSelfie(this.removeBg);
  }

  ngOnInit(): void {
    this.cameraService.base64Image = null;
    this.cameraService.webcamImage = null;
    this.store.dispatch(new SetAutoRouting(true));
    this.loadingService.isLoading = true;
    this.loadingService.loadingText = 'loading...';
    this.siteStateService.checkServerState();

    this.backendConnectService.getSettings().subscribe((res: any) => {
      this.store.dispatch(new SetSettings(res));
      this.settingsLoaded = true;
    });

    this.settings$.subscribe((settings: Settings) => {
      this.settings = settings;
    });
  }

  generateConverterNameArray(config: ConverterConfig[]) {
    let converterNames: string[] = [];
    for (let converter of config) {
      converterNames.push(converter.name);
    }
    return converterNames;
  }

  onConverterSelectChange() {
    if (this.settingsLoaded) {
      console.log('changed');
      this.backendConnectService.setSettings(this.settings);
    }
  }

  getConverterConfigByName(converter: string): ConverterConfig | undefined {
    return this.settings.converter.availableConverter.find(
      (c) => c.name == converter
    );
  }
}
