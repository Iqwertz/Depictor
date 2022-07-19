import {
  Component,
  OnInit,
  EventEmitter,
  Output,
  ViewChild,
  OnDestroy,
} from '@angular/core';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { NgTerminal } from 'ng-terminal';
import { FitAddon } from 'xterm-addon-fit';
import { WebLinksAddon } from 'xterm-addon-web-links';
import { TerminalService } from '../../services/terminal.service';

@Component({
  selector: 'app-terminal',
  templateUrl: './terminal.component.html',
  styleUrls: ['./terminal.component.scss'],
})
export class TerminalComponent implements OnInit, OnDestroy {
  @Output() close = new EventEmitter<null>();

  faTimes = faTimes;

  terminalHistory: string[] = [];
  commandHistory: string[] = [];
  commandHistoryIndex = 0;

  @ViewChild('term', { static: true }) child!: NgTerminal;
  currentLine: string = '';
  pcTyping: boolean = false;
  lineStartLength = 0;
  fitAddon = new FitAddon();

  constructor(private terminalService: TerminalService) {}

  ngOnInit(): void {
    this.terminalService.connectTerminal();
  }

  ngOnDestroy() {
    this.terminalService.disconnect();
  }

  ngAfterViewInit() {
    this.child.underlying.loadAddon(new WebLinksAddon());
    this.child.underlying.loadAddon(this.fitAddon);
    this.fitAddon.fit();
    this.child.underlying.setOption('theme', {
      background: '#232729',
    });
    this.child.underlying.blur();
    this.child.underlying.setOption('cursorBlink', true);
    this.child.keyEventInput.subscribe((e) => {
      const ev = e.domEvent;
      //check if direction key

      const printable =
        !ev.altKey &&
        !ev.ctrlKey &&
        !ev.metaKey &&
        ev.key !== 'ArrowDown' &&
        ev.key !== 'ArrowUp' &&
        ev.key !== 'ArrowLeft' &&
        ev.key !== 'ArrowRight';

      if (ev.keyCode === 13) {
        console.log(this.currentLine);
        this.terminalService.sendCommand(this.currentLine);
        this.commandHistory.push(this.currentLine);
        this.compressCommandHistory();
        this.commandHistoryIndex = this.commandHistory.length;
        this.child.write('\r\n ');
        this.currentLine = '';
      } else if (ev.keyCode === 8) {
        if (
          this.child.underlying.buffer.active.cursorX > this.lineStartLength
        ) {
          this.child.write('\b \b');
          this.currentLine = this.currentLine.slice(0, -1);
        }
      } else if (ev.key === 'ArrowUp') {
        if (this.commandHistoryIndex > 0 && this.commandHistory.length > 0) {
          this.commandHistoryIndex--;
          this.currentLine = this.commandHistory[this.commandHistoryIndex];
          this.child.write('\x1b[2K\r');
          this.child.write(this.currentLine);
        }
      } else if (ev.key === 'ArrowDown') {
        if (
          this.commandHistoryIndex < this.commandHistory.length - 1 &&
          this.commandHistory.length > 0
        ) {
          this.commandHistoryIndex++;
          this.currentLine = this.commandHistory[this.commandHistoryIndex];
          this.child.write('\x1b[2K\r');
          this.child.write(this.currentLine);
        }
      } else if (printable) {
        this.child.write(e.key);
        this.currentLine += e.key;
      }
    });

    this.terminalService.serialDataObervable.subscribe((data) => {
      this.child.write(data);
    });
  }

  closeTerminal() {
    this.close.emit();
  }

  compressCommandHistory() {
    //check for duplicates
    const unique = [...new Set(this.commandHistory)];
    this.commandHistory = unique;
  }
}
