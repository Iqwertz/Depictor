import { Component, OnInit } from '@angular/core';
import { faTerminal } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-terminal-button',
  templateUrl: './terminal-button.component.html',
  styleUrls: ['./terminal-button.component.scss'],
})
export class TerminalButtonComponent implements OnInit {
  showTerminal = false;
  faCog = faTerminal;

  constructor() {}

  ngOnInit(): void {}
}
