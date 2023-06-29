import { environment } from './../../../../../environments/environment';
import {
  Component,
  OnInit,
  Output,
  ViewChild,
  EventEmitter,
} from '@angular/core';
import {
  faArrowsAltH,
  faArrowsAltV,
  faInfoCircle,
  faPowerOff,
  faRotateRight,
  faTimes,
} from '@fortawesome/free-solid-svg-icons';
import {
  BackendConnectService,
  BackendVersion,
} from '../../../../services/backend-connect.service';
import { AppState } from '../../../../store/app.state';
import { Select, Store } from '@ngxs/store';
import { SetIp } from '../../../../store/app.action';
import { Router } from '@angular/router';
import { ConfirmDialogComponent } from 'src/app/modules/shared/components/confirm-dialog/confirm-dialog.component';
import { HttpClient } from '@angular/common/http';
import { LoadingService } from '../../services/loading.service';
import { SiteStateService } from '../../../../services/site-state.service';
import { StandartizerSettings } from '../../../gcode/services/gcode-viewer.service';
import { PaperProfilePopupComponent } from '../paper-profile-popup/paper-profile-popup.component';
import { JsonSetting } from '../json-settings/json-settings.component';
import { SnackbarService } from 'src/app/services/snackbar.service';

export interface PaperProfile {
  name: string;
  paperMax: number[]; //Maximum coordinates of the drawing area ("Drawing area end" in the settings UI)
  drawingOffset: number[]; //Offset of the drawing area from the origin ("Drawing area start" in the settings UI)
}

export interface Transformation {
  rotate: number; //Amount of times rotated 90° clockwise
  mirrorX: boolean;
  mirrorY: boolean;
}

export interface Settings {
  endGcode: string;
  startGcode: string;
  penDownCommand: string;
  penUpCommand: string;
  avgTimePerLine: number;
  maxImageFileSize: number;
  centerOnDrawingArea: boolean;
  traverseBoundingBox: boolean;
  traverseBoundingBoxSpeed: number;
  paperProfiles: PaperProfile[];
  selectedPaperProfile: PaperProfile;
  gcodeDefaultTransform: Transformation; //Default Transform applied to all gcodes
  displayDefaultTransform: Transformation; //Default Transdorm applied to The gcode Renderer
  standardizeGcode: boolean;
  standardizerSettings: StandartizerSettings;
  enablePenChange: boolean;
  penChangeSettings: PenChangeSettings;
  floatingPoints: number;
  port: string;
  converter: ConverterSettings;
  autoSelectConverter: boolean;
  enableHardwareControlflow: boolean;
}

export interface PenChangeSettings {
  penChangeCommand: string;
  penChangeParkGcode: string;
  penChangeUnparkGcode: string;
}

export interface ConverterSettings {
  availableConverter: ConverterConfig[];
  selectedConverter: string;
}

export interface ConverterConfig {
  name: string;
  needInputFile: boolean; //true if the converter needs an image as input
  inputFiletype: string; //filetype of the input file
  acceptedFiletypes: string; //filetypes that are allowed to upload (e.g. "image/*" for all image types)
  isBinary: boolean; //is the file binary or text
}

export interface SerialPort {
  path: string;
  manufacturer: string;
}

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
})
export class SettingsComponent implements OnInit {
  @Select(AppState.ip)
  ip$: any;
  ip: string = '';
  @Output() close = new EventEmitter<null>();

  @ViewChild('dialog', { static: false })
  confirmDialog: ConfirmDialogComponent | undefined;

  @ViewChild('deleteSaved', { static: false })
  confirmCancleSave: ConfirmDialogComponent | undefined;

  @ViewChild('paperprofilepopup', { static: false })
  paperProfilePopup: PaperProfilePopupComponent | undefined;

  faPowerOff = faPowerOff;
  faTimes = faTimes;
  faInfo = faInfoCircle;
  faRotate = faRotateRight;
  faMirrorX = faArrowsAltV;
  faMirrorY = faArrowsAltH;

  bgRemoveApiKey = '';

  environment = environment;

  currentJsonSettings: JsonSetting | null = null;
  currentJsonSettingsName: string = '';

  @Select(AppState.settings) settings$: any;
  settings: Settings = JSON.parse(JSON.stringify(environment.defaultSettings));

  settingsBefore: Settings = JSON.parse(
    JSON.stringify(environment.defaultSettings)
  );

  backendVersion: BackendVersion = {
    tag: 'NAN',
    production: false,
  };

  availableSerialPorts: SerialPort[] = [];

  updatesAvailable: boolean = false;
  availableUpdateVersion: string = '';

  showLogs: boolean = false;

  constructor(
    private backendConnectService: BackendConnectService,
    private store: Store,
    private router: Router,
    private http: HttpClient,
    private loadingService: LoadingService,
    public siteStateService: SiteStateService,
    private snackBar: SnackbarService
  ) {}

  ngOnInit(): void {
    this.ip$.subscribe((ip: string) => {
      this.ip = ip;
    });

    this.backendConnectService.getBackendVersion().subscribe((v) => {
      this.backendVersion = v;
      this.checkForUpdates();
    });

    this.backendConnectService
      .getAvailableSerialPorts()
      .subscribe((res: any) => {
        if (!this.settings.port) {
          this.settings.port = res.ports[0].path;
          this.setSerialPort();
        }
        this.availableSerialPorts = res.ports;
      });

    this.settings$.subscribe((settings: Settings) => {
      this.settings = settings;
    });

    this.siteStateService.checkServerState();

    this.getIniSettings();
  }

  shutdown() {
    this.backendConnectService.shutdown();
    this.router.navigate(['']);
  }

  setSerialPort() {
    this.backendConnectService
      .setSerialPort(this.settings.port)
      .subscribe((res: any) => {
        console.log(res);
      });
  }

  updatePaperProfile(profileName: string) {
    //get profile by name
    const profile: PaperProfile | undefined = this.settings.paperProfiles.find(
      (p) => p.name === profileName
    );
    if (profile) {
      this.settings.selectedPaperProfile = JSON.parse(JSON.stringify(profile));
    } else {
      console.error('Cant select profile: profile not found');
    }
  }

  editPaperProfile() {
    this.paperProfilePopup!.show = true;
    this.paperProfilePopup!.profile = JSON.parse(
      JSON.stringify(this.settings.selectedPaperProfile)
    );
    this.paperProfilePopup!.editedProfileName =
      this.settings.selectedPaperProfile.name;
    console.log(this.settings);
  }

  createPaperProfile() {
    this.paperProfilePopup!.show = true;
    this.paperProfilePopup!.editedProfileName = null;
  }

  setBgRemoveApiKey() {
    this.backendConnectService.setBGRemoveAPIKey(this.bgRemoveApiKey);
    this.bgRemoveApiKey = '';
  }

  setNewIp() {
    this.siteStateService.serverOnline = false;
    this.store.dispatch(new SetIp(this.ip));
    localStorage.setItem('ip', this.ip);
    this.router.navigate(['']);
  }

  home() {
    this.backendConnectService.home();
  }

  penUp() {
    this.backendConnectService.executeGcode(
      `$X;\n${this.settings.penUpCommand};`
    );
  }

  penDown() {
    this.backendConnectService.executeGcode(
      `$X;\n${this.settings.penDownCommand};`
    );
  }

  checkForUpdates() {
    this.http
      .get('https://api.github.com/repos/iqwertz/depictor/tags')
      .subscribe((res: any) => {
        console.log(res);
        if (
          res[0].name != this.backendVersion.tag &&
          this.backendVersion.production
        ) {
          this.updatesAvailable = true;
          this.availableUpdateVersion = res[0].name;
        }
      });
  }

  checkChanges() {
    this.backendConnectService.getSettings().subscribe((res: any) => {
      if (JSON.stringify(res) !== JSON.stringify(this.settings)) {
        this.confirmCancleSave?.show();
      } else {
        this.close.emit();
      }
    });
  }

  getIniSettings() {
    this.backendConnectService.getSettings().subscribe((res: any) => {
      this.settingsBefore = res;
      console.log('settings before');
      console.log(this.settingsBefore);
    });
  }

  setSettings() {
    this.backendConnectService.setSettings(this.settings);
  }

  discardSettings() {
    this.backendConnectService.syncSettings();
    this.close.emit();
  }

  compareSettings(s1: Settings, s2: Settings) {
    if (JSON.stringify(s1) !== JSON.stringify(s2)) {
      return false;
    }

    return true;
  }

  update() {
    this.backendConnectService.update();
    this.router.navigate(['']);
    this.close.emit();
  }

  resetSettings() {
    this.settings = JSON.parse(
      JSON.stringify(this.environment.defaultSettings)
    );
  }

  openConverterSettings(converter: string) {
    this.backendConnectService
      .getConverterSettings(converter)
      .subscribe((converterSettings) => {
        if (converterSettings.err == 'no_settings_found') {
          this.snackBar.error("Converter doesn't have settings");
        } else if (!converterSettings) {
          this.snackBar.error(
            'Unexpected Error when trying to load settings of: ' + converter
          );
        } else {
          this.currentJsonSettings = converterSettings;
          this.currentJsonSettingsName = converter;
        }
      });
  }

  saveCurrentJsonSettings() {
    if (!this.currentJsonSettings) return;
    this.backendConnectService.setConverterSettings(
      this.currentJsonSettingsName,
      this.currentJsonSettings
    );
    this.currentJsonSettings = null;
  }
}
