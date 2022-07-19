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

  @ViewChild('term', { static: true }) child!: NgTerminal;
  currentLine: string = '';
  pcTyping: boolean = false;
  lineStartLength = 2;
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
    this.child.underlying.setOption('scrollback', true);
    this.child.keyEventInput.subscribe((e) => {
      const ev = e.domEvent;
      const printable = !ev.altKey && !ev.ctrlKey && !ev.metaKey;
      if (ev.keyCode === 13) {
        console.log(this.currentLine);
        this.terminalService.sendCommand(this.currentLine);
        this.child.write('\r\n ');
        this.currentLine = '';
      } else if (ev.keyCode === 8) {
        if (
          this.child.underlying.buffer.active.cursorX > this.lineStartLength
        ) {
          this.child.write('\b \b');
          this.currentLine = this.currentLine.slice(0, -1);
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
}
