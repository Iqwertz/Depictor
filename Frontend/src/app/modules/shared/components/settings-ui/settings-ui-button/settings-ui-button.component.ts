import { Component, Input, OnInit, EventEmitter, Output } from '@angular/core';
import { faPowerOff } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-settings-ui-button',
  templateUrl: './settings-ui-button.component.html',
  styleUrls: ['./settings-ui-button.component.scss'],
})
export class SettingsUiButtonComponent implements OnInit {
  constructor() {}

  faPowerOff = faPowerOff;
  @Input() name: string = '';
  @Input() offButton: boolean = false; //dirty but it works
  @Output('clicked') click = new EventEmitter<boolean>();

  ngOnInit(): void {}

  clicked() {
    this.click.emit(true);
  }
}
