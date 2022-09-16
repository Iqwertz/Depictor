import { Component, OnInit, EventEmitter, Output } from '@angular/core';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { BackendConnectService } from '../../../../services/backend-connect.service';

export type LogLevel = 'info' | 'http' | 'warn' | 'error';

export interface LogLine {
  level: LogLevel;
  message: string;
  service: string;
  timestamp: string;
}

@Component({
  selector: 'app-log-display',
  templateUrl: './log-display.component.html',
  styleUrls: ['./log-display.component.scss'],
})
export class LogDisplayComponent implements OnInit {
  @Output() close = new EventEmitter<null>();
  faTimes = faTimes;

  loggingData: LogLine[] = [];

  constructor(private backendConnectService: BackendConnectService) {}

  ngOnInit(): void {
    this.backendConnectService.getLoggingData(90).subscribe((rawdata: any) => {
      rawdata.data.pop();
      rawdata.data = rawdata.data.reverse();
      for (let line of rawdata.data) {
        this.loggingData.push(JSON.parse(line));
      }
    });
  }

  closeTerminal() {
    this.close.emit();
  }
}
