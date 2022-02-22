//////Use
/*
  @Select(AppState.userId)
  userId$;
  ngOninit:
    this.userId$.subscribe((userId: string) => {
      this.userId = userId;
    });
  Set:
  constructor: private store: Store
  this.store.dispatch(new SetUserId(x));
*/

import { State, Action, StateContext, Selector } from '@ngxs/store';
import { SetIp, SetAutoRouting, SetSettings } from './app.action';
import { environment } from '../../environments/environment';
import { Settings } from '../modules/shared/components/settings/settings.component';

export interface AppStateModel {
  ip: string;
  autoRouting: boolean;
  settings: Settings;
}

@State<AppStateModel>({
  name: 'appState',
  defaults: {
    ip: environment.ip,
    autoRouting: true,
    settings: environment.defaultSettings,
  },
})
export class AppState {
  @Selector()
  static ip(state: AppStateModel) {
    return state.ip;
  }

  @Action(SetIp)
  SetIp(context: StateContext<AppStateModel>, action: SetIp) {
    context.patchState({
      ip: action.ip,
    });
  }

  @Selector()
  static autoRouting(state: AppStateModel) {
    return state.autoRouting;
  }

  @Action(SetAutoRouting)
  SetAutoRouting(context: StateContext<AppStateModel>, action: SetAutoRouting) {
    context.patchState({
      autoRouting: action.autoRouting,
    });
  }

  @Selector()
  static settings(state: AppStateModel) {
    return state.settings;
  }

  @Action(SetSettings)
  SetSettings(context: StateContext<AppStateModel>, action: SetSettings) {
    context.patchState({
      settings: action.settings,
    });
  }
}
