import { Injectable, EventEmitter } from '@angular/core';
import { Select } from '@ngxs/store';
import { io } from 'socket.io-client';
import { Socket } from 'socket.io-client';
import { environment } from 'src/environments/environment';
import { AppState } from '../../../store/app.state';

@Injectable({
  providedIn: 'root',
})
export class TerminalService {
  socket: Socket | null = null;

  serialDataObervable = new EventEmitter<string>();
  disconnected = new EventEmitter<boolean>();

  //create event emitter

  @Select(AppState.ip)
  ip$: any;
  ip: string = '';

  constructor() {
    this.ip$.subscribe((ip: string) => {
      this.ip = ip;
    });
  }

  connectTerminal() {
    this.socket = io(this.ip);

    this.socket.on('connect', () => {
      console.log('Connected to terminal');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from terminal');
      this.disconnected.emit(true);
    });

    this.socket.on('disconnectSelf', () => {
      console.log('Disconnected from terminal');
      this.disconnected.emit(true);
    });

    this.socket.on('serialData', (command: string) => {
      console.log('serialData:', command);
      this.serialDataObervable.emit(command);
    });

    this.socket.on('commandData', (command: string) => {
      console.log('CommandData:', command);
      this.serialDataObervable.emit('> ' + command + '\r\n');
    });

    this.socket.on('serialError', (error: string) => {
      console.log('serialError:', error);
      this.serialDataObervable.emit('\x1b[1;31m' + error + '\x1b[37m \n');
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }

  sendCommand(command: string) {
    this.socket?.emit('command', command);
  }
}
