import { Injectable } from '@angular/core';
import { CameraServiceService } from './camera-service.service';
import { HttpClient } from '@angular/common/http';
import { Store, Select } from '@ngxs/store';
import { LoadingService } from '../modules/shared/services/loading.service';
import { AppState } from '../store/app.state';
import { Observable } from 'rxjs';
import { StateResponse } from './site-state.service';
import { environment } from '../../environments/environment';
import { Settings } from '../modules/shared/components/settings/settings.component';
import { SetSettings } from '../store/app.action';

export interface BackendVersion {
  tag: string;
  production: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class BackendConnectService {
  @Select(AppState.ip)
  ip$: any;
  ip: string = '';

  constructor(
    private cameraService: CameraServiceService,
    private http: HttpClient,
    private loadingService: LoadingService,
    private store: Store
  ) {
    this.ip$.subscribe((ip: string) => {
      this.ip = ip;
      this.syncSettings();
    });
  }

  postSelfie(removeBg: boolean) {
    if (this.cameraService.base64Image) {
      let img = this.cameraService.base64Image.split('base64,')[1];
      this.loadingService.isLoading = true;
      this.http
        .post('http://' + this.ip + '/newPicture', {
          img: img,
          removeBg: removeBg,
        })
        .subscribe((res) => {
          console.log(res);
          if (!res.hasOwnProperty('err')) {
            this.checkProgress();
          } else {
            this.loadingService.isLoading = false;
            console.log('error sending image');
          }
        });
    } else {
      console.error('No image saved!');
    }
  }

  checkProgress(): Observable<StateResponse> {
    return this.http.post<StateResponse>(
      'http://' + this.ip + '/checkProgress',
      {}
    );
  }

  checkDrawingProgress(): Observable<any> {
    return this.http.post<StateResponse>(
      'http://' + this.ip + '/getDrawingProgress',
      {}
    );
  }

  getDrawenGcode(): Observable<StateResponse> {
    return this.http.post<StateResponse>(
      'http://' + this.ip + '/getDrawenGcode',
      {}
    );
  }

  getGeneratedGcode(): Observable<StateResponse> {
    return this.http.post<StateResponse>(
      'http://' + this.ip + '/getGeneratedGcode',
      {}
    );
  }

  setBGRemoveAPIKey(key: string) {
    console.log(key);
    this.http
      .post('http://' + this.ip + '/setBGRemoveAPIKey', { key: key })
      .subscribe((res: any) => {
        console.log(res);
      });
  }

  postGcode(gcode: string) {
    this.http
      .post('http://' + this.ip + '/postGcode', { gcode: gcode })
      .subscribe((res: any) => {
        console.log(res);
        this.loadingService.serverResponseToLoadingText(res.appState);
      });
  }

  cancle() {
    this.http
      .post('http://' + this.ip + '/cancle', {})
      .subscribe((res: any) => {
        //optional Error handling
      });
  }

  home() {
    this.http.post('http://' + this.ip + '/home', {}).subscribe((res: any) => {
      //optional Error handling
    });
  }

  getBackendVersion(): Observable<BackendVersion> {
    return this.http.post<BackendVersion>(
      'http://' + this.ip + '/getVersion',
      {}
    );
  }

  executeGcode(gcode: string) {
    this.http
      .post('http://' + this.ip + '/executeGcode', { gcode: gcode })
      .subscribe((res: any) => {
        //optional Error handling
      });
  }

  stop() {
    this.http.post('http://' + this.ip + '/stop', {}).subscribe((res: any) => {
      //optional Error handling
    });
  }

  update() {
    this.http
      .post('http://' + this.ip + '/update', {
        version: environment.version,
        production: environment.production,
      })
      .subscribe((res: any) => {
        //optional Error handling
      });
  }

  shutdown() {
    this.http
      .post('http://' + this.ip + '/shutdown', {})
      .subscribe((res: any) => {
        //optional Error handling
      });
  }

  delete(id: string) {
    this.http
      .post('http://' + this.ip + '/delete', { id: id })
      .subscribe((res: any) => {
        //optional Error handling
      });
  }

  getGallery(range?: number[]): Observable<any> {
    return this.http.post('http://' + this.ip + '/getGcodeGallery', {
      range: range,
    });
  }

  getGcodeById(id: string) {
    return this.http.post('http://' + this.ip + '/getGcodeById', { id: id });
  }

  setSettings(settings: Settings) {
    this.store.dispatch(new SetSettings(settings));
    console.log(settings);
    this.http
      .post('http://' + this.ip + '/changeSettings', {
        settings: settings,
      })
      .subscribe((res: any) => {
        //optional error handling
      });
  }

  syncSettings() {
    this.http
      .post('http://' + this.ip + '/changeSettings', {})
      .subscribe((res: any) => {
        if (res.settings) {
          this.store.dispatch(new SetSettings(res.settings));
        }
      });
  }
}
