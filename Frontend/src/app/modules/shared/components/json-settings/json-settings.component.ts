import { KeyValue } from '@angular/common';
import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { faChevronLeft } from '@fortawesome/free-solid-svg-icons';

export interface JsonSetting {
  [key: string]: string | number | boolean | JsonSetting;
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
    return typeof value;
  }

  setSubSettings(
    value: KeyValue<string, string | number | boolean | JsonSetting>
  ): void {
    if (typeof value.value === 'object') {
      this.subSettings = value.value;
      this.subSettingName = value.key;
    }
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
