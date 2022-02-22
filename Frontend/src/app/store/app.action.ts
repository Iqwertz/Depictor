import { Settings } from '../modules/shared/components/settings/settings.component';
export class SetIp {
  static type = 'SetIp';
  constructor(public ip: string) {}
}

export class SetAutoRouting {
  static type = 'SetAutoRouting';
  constructor(public autoRouting: boolean) {}
}

export class SetSettings {
  static type = 'SetSettings';
  constructor(public settings: Settings) {}
}
