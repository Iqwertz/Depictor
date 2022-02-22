import { Component, Input, OnInit } from '@angular/core';
import { faCog } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-settings-button',
  templateUrl: './settings-button.component.html',
  styleUrls: ['./settings-button.component.scss'],
})
export class SettingsButtonComponent implements OnInit {
  @Input() white: boolean = false;

  showSettings = false;
  faCog = faCog;

  constructor() {}

  ngOnInit(): void {}
}
