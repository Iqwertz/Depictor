import { GcodeViewerService } from '../modules/gcode/services/gcode-viewer.service';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { ActivatedRoute, Router } from '@angular/router';
import { Select, Store } from '@ngxs/store';
import { AppState } from '../store/app.state';
import { SetIp } from '../store/app.action';
import { BackendConnectService } from './backend-connect.service';
import { LoadingService } from '../modules/shared/services/loading.service';
import { HttpErrorResponse } from '@angular/common/http';

export type AppStates =
  | 'idle'
  | 'removingBg'
  | 'processingImage'
  | 'rawGcodeReady'
  | 'updating'
  | 'error';

export interface StateResponse {
  state: AppStates;
  isDrawing: boolean;
  removeBG: boolean;
  data?: string;
  multiTool?: MultiToolState;
}

export interface MultiToolState {
  active: boolean;
  state: 'drawing' | 'waiting' | 'finished' | 'failed';
  currentMessage: string;
  currentColor: string;
  currentGcodeId: number;
  multiToolGcodes: MultiToolGcode[];
}

interface MultiToolGcode {
  gcodeName: string;
  message: string;
  color: string;
}

@Injectable({
  providedIn: 'root',
})
export class SiteStateService {
  @Select(AppState.ip)
  ip$: any;

  @Select(AppState.autoRouting)
  autoRouting$: any;
  autoRouting: boolean = true;

  lastAppState: AppStates = 'idle';
  serverOnline: boolean = false;

  appState: StateResponse = {
    isDrawing: false,
    state: 'idle',
    removeBG: false,
  };

  constructor(
    private route: ActivatedRoute,
    private store: Store,
    private backendConnectService: BackendConnectService,
    private loadingService: LoadingService,
    private router: Router,
    private gcodeViewerService: GcodeViewerService
  ) {
    this.route.queryParams.subscribe((params) => {
      if (params.ip) {
        this.store.dispatch(new SetIp(params.ip));
        localStorage.setItem('ip', params.ip);
      } else {
        let localIp = localStorage.getItem('ip');
        if (localIp) {
          this.store.dispatch(new SetIp(localIp));
        } else {
          console.log('No Ip found - trying url as ip');
          store.dispatch(
            new SetIp(window.location.hostname + ':' + environment.defaultPort)
          );
        }
      }

      if (params.removeBGApiKey) {
        backendConnectService.setBGRemoveAPIKey(params.removeBGApiKey);
      }
    });

    this.autoRouting$.subscribe((autoRouting: boolean) => {
      this.autoRouting = autoRouting;
    });

    let hasPreviousNavigation = Boolean(
      this.router.getCurrentNavigation()?.previousNavigation
    );
    if (!hasPreviousNavigation) {
      backendConnectService.checkProgress().subscribe((res) => {
        if (res.isDrawing) {
          console.log('drawing');
          this.router.navigate(['gcode', 'drawing']);
        }
      });
    }
    setInterval(() => {
      this.checkServerState();
    }, environment.appStateCheckInterval);
  }

  checkServerState() {
    if (!this.serverOnline) {
      console.log('Server offline - checking availability');
    }
    this.backendConnectService.checkProgress().subscribe(
      (res: StateResponse) => {
        this.appState = res;
        this.serverOnline = true;
        if (!this.autoRouting) {
          return;
        }

        if (res.state == 'idle') {
          if (this.lastAppState == 'updating') {
            window.location.reload();
          }
          this.loadingService.isLoading = false;
          this.router.navigate(['start']);
        } else if (
          res.state == 'processingImage' ||
          res.state == 'removingBg'
        ) {
          this.loadingService.isLoading = true;
          this.loadingService.serverResponseToLoadingText(res.state);
          this.router.navigate(['start']);
        } else if (res.state == 'rawGcodeReady') {
          if (this.router.url == '/start') {
            this.getGeneratedGcode();
          }
          if (this.lastAppState != 'rawGcodeReady') {
            this.getGeneratedGcode();
          } else if (this.gcodeViewerService.gcodeFile.length <= 5) {
            this.getGeneratedGcode();
          }
        } else if (res.state == 'updating') {
          this.loadingService.isLoading = true;
          this.loadingService.loadingText = 'updating! Don`t turn off system';
          this.router.navigate(['start']);
        } else if (res.state == 'error') {
          console.error('Something went wrong on the server!');
        }

        this.lastAppState = res.state;
      },
      (error: HttpErrorResponse) => {
        if (error.status == 0) {
          this.serverOnline = false;
          console.log('Server Offline!');
          this.router.navigate(['']);
        }
      }
    );
  }

  getGeneratedGcode() {
    this.backendConnectService.getGeneratedGcode().subscribe(
      (res: StateResponse) => {
        if (res.data) {
          //        console.log(res.data);
          this.gcodeViewerService.setGcodeFile(res.data, 'generated', '');
          this.gcodeViewerService.gcodeId = '';
          this.gcodeViewerService.scaleToDrawingArea = true;
          this.loadingService.isLoading = false;
          this.router.navigate(['gcode', 'editGcode']);
        }
      },
      (error: HttpErrorResponse) => {
        if (error.status == 0) {
          this.serverOnline = false;
          console.log('Server Offline!');
          this.router.navigate(['']);
        }
      }
    );
  }

  getDrawenGcode() {
    this.backendConnectService.getDrawenGcode().subscribe(
      (res: StateResponse) => {
        if (res.data) {
          //        console.log(res.data);
          this.gcodeViewerService.setGcodeFile(res.data, 'drawing', '');
          this.loadingService.isLoading = false;
        }
      },
      (error: HttpErrorResponse) => {
        if (error.status == 0) {
          this.serverOnline = false;
          console.log('Server Offline!');
          this.router.navigate(['']);
        }
      }
    );
  }
}
