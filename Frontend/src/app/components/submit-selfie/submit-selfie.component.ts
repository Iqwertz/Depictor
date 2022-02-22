import { Component, OnInit, EventEmitter, Output } from '@angular/core';
import { BackendConnectService } from '../../services/backend-connect.service';

@Component({
  selector: 'app-submit-selfie',
  templateUrl: './submit-selfie.component.html',
  styleUrls: ['./submit-selfie.component.scss'],
})
export class SubmitSelfieComponent implements OnInit {
  constructor() {}

  @Output() clicked = new EventEmitter<null>();

  ngOnInit(): void {}

  submit(): void {
    this.clicked.emit();
  }
}
