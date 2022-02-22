import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';

@Component({
  selector: 'app-confirm-dialog',
  templateUrl: './confirm-dialog.component.html',
  styleUrls: ['./confirm-dialog.component.scss'],
})
export class ConfirmDialogComponent implements OnInit {
  @Input('show') showDialog: boolean = false;

  @Output() yes = new EventEmitter<null>();
  @Output() no = new EventEmitter<null>();

  constructor() {}

  ngOnInit(): void {}

  show() {
    this.showDialog = true;
  }
}
