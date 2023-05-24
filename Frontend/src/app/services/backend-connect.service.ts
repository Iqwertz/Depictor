import { LogLevel } from './../modules/shared/components/log-display/log-display.component';
/**
 * backend-connect service
 *
 * This service handles all post or get requests to the backend
 */

import { Injectable } from '@angular/core';
import { CameraServiceService } from './camera-service.service';
import { HttpClient } from '@angular/common/http';
import { Store, Select } from '@ngxs/store';
import { LoadingService } from '../modules/shared/services/loading.service';
import { AppState } from '../store/app.state';
import { Observable } from 'rxjs';
import { StateResponse } from './site-state.service';
import { environment } from '../../environments/environment';
import {
  ConverterConfig,
  Settings,
} from '../modules/shared/components/settings/settings.component';
import { SetSettings } from '../store/app.action';
import { map } from 'rxjs/operators';
import { Router } from '@angular/router';
import { SnackbarService } from './snackbar.service';
import { GalleryEntryUpload } from '../modules/gcode/sites/gcode-edit/gcode-edit.component';
import { JsonSetting } from '../modules/shared/components/json-settings/json-settings.component';

export interface BackendVersion {
  tag: string; //version tag is used to check if a newer version is available
  production: boolean; //production var is used to determin if the current system is in production (some features are deactivated in a test env.)
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
    private store: Store,
    private router: Router,
    private snackbarService: SnackbarService
  ) {
    this.ip$.subscribe((ip: string) => {
      this.ip = ip;
      this.syncSettings();
    });
  }

  /**
   *processes the cameraService base64 image and sends it to the backend
   *
   * @param {boolean} removeBg true when the background of the image should get removed
   * @memberof BackendConnectService
   */
  sendSelfie(removeBg: boolean) {
    if (this.cameraService.base64Image) {
      //check if there is a image
      let img = this.cameraService.base64Image.split('base64,')[1];

      let config: ConverterConfig | undefined =
        this.cameraService.converterConfig;

      if (!config) {
        this.snackbarService.error(
          'Missing converter config! Cant upload Picture!'
        );
        return;
      }

      this.sendImageConvertionRequst(img, removeBg, config);
    } else {
      console.error('No image saved!');
    }
  }

  /**
   * Sends a post request to start the image convertion process with the given image
   *
   * @param img
   * @param removeBg
   */
  sendImageConvertionRequst(
    img: string,
    removeBg: boolean,
    converterConfig: ConverterConfig
  ) {
    this.loadingService.isLoading = true;
    this.http
      .post('http://' + this.ip + '/newPicture', {
        //post image data with parameter
        img: img,
        removeBg: removeBg,
        config: converterConfig,
      })
      .subscribe((res) => {
        if (res.hasOwnProperty('err')) {
          //check for errors in response
          this.loadingService.isLoading = false;
          console.log('error starting image convertion');
        }
      });
  }

  /**
   * Sends a post request to start the file convertion process with the given file
   *
   * @param img
   * @param converterConfig
   */
  sendFileConvertionRequst(img: string, converterConfig: ConverterConfig) {
    this.loadingService.isLoading = true;
    this.http
      .post('http://' + this.ip + '/newFile', {
        //post image data with parameter
        img: img,
        config: converterConfig,
      })
      .subscribe((res) => {
        if (res.hasOwnProperty('err')) {
          //check for errors in response
          this.loadingService.isLoading = false;
          console.log('error starting image convertion');
        }
      });
  }

  /**
   *sends a post request to check the current backend server state
   *
   * @return {*}  {Observable<StateResponse>}
   * @memberof BackendConnectService
   */
  checkProgress(): Observable<StateResponse> {
    return this.http.post<StateResponse>(
      'http://' + this.ip + '/checkProgress',
      {}
    );
  }

  /**
   * Sends a post request to check the drawing progress
   *
   * @memberof BackendConnectService
   */
  checkDrawingProgress(): Observable<any> {
    return this.http.post<StateResponse>(
      'http://' + this.ip + '/getDrawingProgress',
      {}
    );
  }

  /**
   *Sends a post request to get the currently drawen gcode
   *
   * @return {*}  {Observable<StateResponse>}
   * @memberof BackendConnectService
   */
  getDrawenGcode(): Observable<StateResponse> {
    return this.http.post<StateResponse>(
      'http://' + this.ip + '/getDrawenGcode',
      {}
    );
  }

  /**
   * Sends a post request to get the last generated Gcode (if available)
   *
   * @return {*}  {Observable<StateResponse>}
   * @memberof BackendConnectService
   */
  getGeneratedGcode(): Observable<StateResponse> {
    return this.http.post<StateResponse>(
      'http://' + this.ip + '/getGeneratedGcode',
      {}
    );
  }

  /**
   *sends a post request to set the remove.bg api key on the server
   *
   * @param {string} key the remove.bg api key
   * @memberof BackendConnectService
   */
  setBGRemoveAPIKey(key: string) {
    this.http
      .post('http://' + this.ip + '/setBGRemoveAPIKey', { key: key })
      .subscribe((res: any) => {
        this.snackbarService.success('Updated BG remove key!');
        console.log(res);
      });
  }

  /**
   *starts the drawing process by sending a post request with the to be drawen gcode
   *
   * @param {string} gcode
   * @memberof BackendConnectService
   */
  postGcode(gcode: string) {
    this.http
      .post('http://' + this.ip + '/postGcode', { gcode: gcode })
      .subscribe((res: any) => {
        console.log(res);
        this.loadingService.serverResponseToLoadingText(res.appState);
      });
  }

  /**
   * continues the multi tool drawing process
   * @memberof BackendConnectService
   */
  continueMultiTool() {
    this.http
      .post('http://' + this.ip + '/continueMultiTool', {})
      .subscribe((res: any) => {
        console.log(res);
      });
  }

  /**
   *cancles the last generated gcode preview. (Used to enable user to generate a new picture)
   *
   * @memberof BackendConnectService
   */
  cancle() {
    this.http
      .post('http://' + this.ip + '/cancle', {})
      .subscribe((res: any) => {
        //optional Error handling
      });
  }

  /**
   *sends a post request to home the printer, request will return an error when the machine is currently drawing
   *
   * @memberof BackendConnectService
   */
  home() {
    this.http.post('http://' + this.ip + '/home', {}).subscribe((res: any) => {
      //optional Error handling
    });
  }

  /**
   *sends a post request to get the current version of the backend
   *
   * @return {*}  {Observable<BackendVersion>}
   * @memberof BackendConnectService
   */
  getBackendVersion(): Observable<BackendVersion> {
    return this.http.post<BackendVersion>(
      'http://' + this.ip + '/getVersion',
      {}
    );
  }

  /**
   *sends a post request to get all available serial ports
   *
   * @return {*}  {Observable<BackendVersion>}
   * @memberof BackendConnectService
   */
  getAvailableSerialPorts(): Observable<BackendVersion> {
    return this.http.post<BackendVersion>(
      'http://' + this.ip + '/getAvailableSerialPorts',
      {}
    );
  }

  /**
   *sends a post request to get all downloadable file types for a given gcodeID
   *
   * @return {*}  {Observable<string[]>}
   * @memberof BackendConnectService
   */
  getAvailableFileTypes(id: string): Observable<string[]> {
    return this.http.post<string[]>('http://' + this.ip + '/availableFiles', {
      id: id,
    });
  }

  /**
   *sends a post request to set a new serial port
   *
   * @return {*}  {Observable<BackendVersion>}
   * @memberof BackendConnectService
   */
  setSerialPort(path: string): Observable<BackendVersion> {
    return this.http.post<BackendVersion>(
      'http://' + this.ip + '/setSerialPort',
      { path: path }
    );
  }

  /**
   *sends a post request to get the last n lines of the log file
   *
   * @param {number} min the start of the log file (in lines)
   * @param {number} max the end of the log file (in lines)
   * @param {LogLevel} level the amout of lines that should be returned
   * @return {*}  {Observable<LoggingData Json>}
   * @memberof BackendConnectService
   */
  getLoggingData(
    min: number,
    max: number,
    level: LogLevel
  ): Observable<BackendVersion> {
    return this.http.post<BackendVersion>(
      'http://' + this.ip + '/getLoggingData',
      { minLines: min, maxLines: max, level: level }
    );
  }

  /**
   *Sends a post request with custom gcode that will be excuted on the machine
   *
   * @param {string} gcode
   * @memberof BackendConnectService
   */
  executeGcode(gcode: string) {
    this.http
      .post('http://' + this.ip + '/executeGcode', { gcode: gcode })
      .subscribe((res: any) => {
        //optional Error handling
      });
  }

  /**
   *sends a post request to stop the current drawing process
   *
   * @memberof BackendConnectService
   */
  stop() {
    this.http.post('http://' + this.ip + '/stop', {}).subscribe((res: any) => {
      this.snackbarService.notification('stopped drawing process');
      //optional Error handling
    });
  }

  /**
   *sends a post request to update the system. Will return a error if no update is available
   *
   * @memberof BackendConnectService
   */
  update() {
    this.snackbarService.notification('starting system update');
    this.http
      .post('http://' + this.ip + '/update', {})
      .subscribe((res: any) => {
        //optional Error handling
      });
  }

  /**
   *sends a post request to  shutdown the rpi
   *
   * @memberof BackendConnectService
   */
  shutdown() {
    this.http
      .post('http://' + this.ip + '/shutdown', {})
      .subscribe((res: any) => {
        //optional Error handling
      });
  }

  /**
   *Sends a post request with an gallery id to delete it from the server
   *
   * @param {string} id gallery id (name of the image and gcode file on the server)
   * @memberof BackendConnectService
   */
  delete(id: string) {
    this.http
      .post('http://' + this.ip + '/delete', { id: id })
      .subscribe((res: any) => {
        this.snackbarService.success('Deleted gcode successfully!');
        //optional Error handling
      });
  }

  /**
   *sends a post request to get images from the gallery. A range can be defined to only load a specific part of the gallery.
   *
   * @param {number[]} [range] when defined only the gallery images inside the range are returned
   * @return {*}  {Observable<any>}
   * @memberof BackendConnectService
   */
  getGallery(range?: number[]): Observable<any> {
    return this.http.post('http://' + this.ip + '/getGcodeGallery', {
      range: range,
    });
  }

  /**
   *Sends a post request to get a gcode file by its gallery id
   *
   * @param {string} id
   * @return {*}
   * @memberof BackendConnectService
   */
  getGcodeById(id: string) {
    return this.http.post('http://' + this.ip + '/getGcodeById', { id: id });
  }

  /**
   *updates the settings by updating the store and sending a post request to change them on the server
   *
   * @param {Settings} settings
   * @memberof BackendConnectService
   */
  setSettings(settings: Settings) {
    this.store.dispatch(new SetSettings(settings));
    console.info(settings);
    this.http
      .post('http://' + this.ip + '/changeSettings', {
        settings: settings,
      })
      .subscribe((res: any) => {
        this.snackbarService.success('settings saved successfully!');
        //optional error handling
      });
  }

  /**
   *updates the converter settings of the defined converter by sending a post request to change them on the server
   *
   * @param {string} converter
   * @param {Settings} settings
   * @memberof BackendConnectService
   */
  setConverterSettings(converter: string, settings: JsonSetting) {
    this.http
      .post('http://' + this.ip + '/changeConverterSettings', {
        converter: converter,
        settings: settings,
      })
      .subscribe((res: any) => {
        this.snackbarService.success(
          'Settings for ' + converter + ' saved successfully!'
        );
        //optional error handling
      });
  }

  /**
   *syncs the settings with the backend by sending a post request, merging them with the default settings and updating the settings store
   *
   * @memberof BackendConnectService
   */
  syncSettings() {
    this.http
      .post('http://' + this.ip + '/changeSettings', {})
      .subscribe((res: any) => {
        if (res.settings) {
          let mergedSettings = {
            ...environment.defaultSettings,
            ...res.settings,
          };
          this.store.dispatch(new SetSettings(mergedSettings));
        } else {
          //Can be improved by communicating with error codes, Now it assumes that no settings means that there werent any settings found...
          this.store.dispatch(new SetSettings(environment.defaultSettings));
          this.setSettings(environment.defaultSettings);
        }
      });
  }

  /**
   * gets the settings from the backend by sending a post request and returns them as a observable.
   *
   * @return {*}  {Observable<any>}
   * @memberof BackendConnectService
   */
  getSettings(): Observable<any> {
    return this.http.post('http://' + this.ip + '/changeSettings', {}).pipe(
      map((res: any) => {
        console.log(res);
        if (res.settings) {
          res.settings = {
            ...environment.defaultSettings,
            ...res.settings,
          };
        }

        return res.settings;
      })
    );
  }

  /**
   * gets the settings for the defined converter from the backend by sending a post request and returns them as a observable.
   *
   * @param {string} converter
   * @return {*}  {Observable<any>}
   * @memberof BackendConnectService
   */
  getConverterSettings(converter: string): Observable<any> {
    return this.http.post('http://' + this.ip + '/changeConverterSettings', {
      converter: converter,
    });
  }

  uploadGcodeToGallery(uploadData: GalleryEntryUpload, redirect: boolean) {
    this.http
      .post('http://' + this.ip + '/uploadGalleryEntry', uploadData)
      .subscribe((res: any) => {
        if (redirect) {
          this.loadingService.isLoading = false;
          this.router.navigate(['gcode', 'gallery']);
        }

        this.snackbarService.notification('uploaded gcode');
        //optional error handling
      });
  }
}
