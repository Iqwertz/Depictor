import { Component, OnInit, EventEmitter, Output } from '@angular/core';
import {
  faChevronLeft,
  faChevronRight,
  faRedoAlt,
  faTimes,
} from '@fortawesome/free-solid-svg-icons';
import { BackendConnectService } from '../../../../services/backend-connect.service';

export type LogLevel = 'info' | 'http' | 'warn' | 'error' | 'debug' | 'grbl';

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
  faChevronLeft = faChevronLeft;
  faChevronRight = faChevronRight;

  loggingData: LogLine[] = [];

  logLevel: LogLevel = 'warn';
  logLevelOptions: LogLevel[] = [
    'http',
    'debug',
    'info',
    'warn',
    'error',
    'grbl',
  ];
  loadedLines: number = 100;

  maxPages: number = -1;
  page: number = 0;

  loading: boolean = false;

  constructor(private backendConnectService: BackendConnectService) {}

  ngOnInit(): void {
    this.reload();
  }

  closeTerminal() {
    this.close.emit();
  }

  increasePage() {
    if (this.page < this.maxPages || this.maxPages == -1) {
      this.page++;
      this.reload();
    }
  }

  decreasePage() {
    if (this.page > 0) {
      this.page--;
      this.reload();
    }
  }

  displayMaxPages(mP: number) {
    if (mP == -1) {
      return '?';
    } else {
      return mP;
    }
  }

  reload() {
    this.loading = true;
    this.backendConnectService
      .getLoggingData(
        this.loadedLines * this.page,
        this.loadedLines * this.page + this.loadedLines,
        this.logLevel
      )
      .subscribe((rawdata: any) => {
        this.loggingData = [];
        //rawdata.data.pop();
        console.log(rawdata);
        rawdata.data = rawdata.data.reverse();
        for (let line of rawdata.data) {
          if (this.logLevel == 'grbl') {
            this.loggingData.push({
              level: 'grbl',
              message: line,
              service: 'grbl',
              timestamp: 'N/A',
            });
          } else {
            try {
              this.loggingData.push(JSON.parse(line));
            } catch (e) {
              console.log('could not parse line: ' + line);
            }
          }
        }
        this.maxPages = Math.ceil(rawdata.lines / this.loadedLines);
        this.loading = false;
      });
  }
}
