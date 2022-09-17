import { Component, OnInit, EventEmitter, Output } from '@angular/core';
import { faRedoAlt, faTimes } from '@fortawesome/free-solid-svg-icons';
import { BackendConnectService } from '../../../../services/backend-connect.service';

export type LogLevel = 'info' | 'http' | 'warn' | 'error' | 'debug';

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
  faReload = faRedoAlt;

  loggingData: LogLine[] = [];

  logLevel: LogLevel = 'warn';
  logLevelOptions: LogLevel[] = ['http', 'debug', 'info', 'warn', 'error'];
  loadedLines: number = 100;

  constructor(private backendConnectService: BackendConnectService) {}

  ngOnInit(): void {
    this.reload();
  }

  closeTerminal() {
    this.close.emit();
  }

  reload() {
    this.backendConnectService
      .getLoggingData(this.loadedLines, this.logLevel)
      .subscribe((rawdata: any) => {
        this.loggingData = [];
        rawdata.data.pop();
        rawdata.data = rawdata.data.reverse();
        for (let line of rawdata.data) {
          this.loggingData.push(JSON.parse(line));
        }
      });
  }
}
