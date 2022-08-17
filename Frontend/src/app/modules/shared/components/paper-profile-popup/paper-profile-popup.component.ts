import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { Select, Store } from '@ngxs/store';
import { PaperProfile, Settings } from '../settings/settings.component';
import { AppState } from '../../../../store/app.state';
import { environment } from '../../../../../environments/environment.prod';
import { SetSettings } from '../../../../store/app.action';
import { faTimes } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-paper-profile-popup',
  templateUrl: './paper-profile-popup.component.html',
  styleUrls: ['./paper-profile-popup.component.scss'],
})
export class PaperProfilePopupComponent implements OnInit {
  profile: PaperProfile = {
    name: '',
    drawingOffset: [0, 0],
    paperMax: [0, 0],
  };

  editedProfileName: string | null = null;
  show: boolean = false;

  faTimes = faTimes;

  @Select(AppState.settings) settings$: any;
  settings: Settings = JSON.parse(JSON.stringify(environment.defaultSettings));

  constructor(private store: Store) {}

  ngOnInit(): void {
    this.settings$.subscribe((settings: Settings) => {
      this.settings = settings;
    });
  }

  addProfile() {
    this.settings.paperProfiles.push(JSON.parse(JSON.stringify(this.profile)));
    this.settings.selectedPaperProfile = JSON.parse(
      JSON.stringify(this.profile)
    );
    this.store.dispatch(new SetSettings(this.settings));
    this.show = false;
  }

  updateProfile() {
    //get index of selected profile
    const index = this.settings.paperProfiles.findIndex(
      (profile: PaperProfile) => {
        return profile.name === this.editedProfileName;
      }
    );
    console.log(index, this.editedProfileName);
    this.settings.paperProfiles[index] = JSON.parse(
      JSON.stringify(this.profile)
    );
    this.settings.selectedPaperProfile = JSON.parse(
      JSON.stringify(this.profile)
    );
    this.store.dispatch(new SetSettings(this.settings));
    this.show = false;
  }

  deleteProfile() {
    //get index of selected profile
    const index = this.settings.paperProfiles.findIndex(
      (profile: PaperProfile) => {
        return profile.name === this.editedProfileName;
      }
    );
    this.settings.paperProfiles.splice(index, 1);
    this.settings.selectedPaperProfile = JSON.parse(
      JSON.stringify(this.settings.paperProfiles[0])
    );
    this.store.dispatch(new SetSettings(this.settings));
    this.show = false;
  }

  cancel() {
    this.show = false;
  }
}
