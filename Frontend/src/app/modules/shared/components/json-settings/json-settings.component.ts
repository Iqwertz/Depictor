import { KeyValue } from '@angular/common';
import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { faChevronLeft } from '@fortawesome/free-solid-svg-icons';

/*
Supported types for json settings:
string, number, boolean, object (with properties of supported types), array (with elements of supported types)

to add a select option add an array with the options and an string variable called "selected"+arrayVariableName

if a variable starts with _ it will be hidden from the settings
*/
export interface JsonSetting {
  [key: string]: string | number | boolean | string[] | JsonSetting;
}

@Component({
  selector: 'app-json-settings',
  templateUrl: './json-settings.component.html',
  styleUrls: ['./json-settings.component.scss'],
})
export class JsonSettingsComponent implements OnInit {
  @Input() zIndex: number = 0;
  @Input() jsonSetting: JsonSetting | null = null;
  @Input() name: string = '';
  @Output() close = new EventEmitter();

  open: boolean = false;
  subSettings: JsonSetting | null = null;
  subSettingName: string = '';

  backIcon = faChevronLeft;

  constructor() {
    this.zIndex++;
  }

  ngOnInit(): void {
    setTimeout(() => {
      this.open = true;
    }, 1);
  }

  getType(value: any): string {
    let type: string = typeof value;
    if (Array.isArray(value)) {
      type = 'array';
    }
    return type;
  }

  //just for ts to not complain
  makeIterable(value: any): string[] {
    if (Array.isArray(value)) {
      return value;
    } else {
      return [];
    }
  }

  setSubSettings(
    value: KeyValue<string, string | string[] | number | boolean | JsonSetting>
  ): void {
    if (typeof value.value === 'object') {
      if (!Array.isArray(value.value)) {
        this.subSettings = value.value;
        this.subSettingName = value.key;
      }
    }
  }

  setSelect(event: any) {
    console.log(event);
  }

  closeSelfe(): void {
    this.open = false;
    setTimeout(() => {
      this.close.emit();
    }, 500);
  }

  trackByFn(index: any, item: any) {
    return index;
  }
}
