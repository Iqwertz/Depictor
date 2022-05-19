import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { SiteStateService } from '../../../../services/site-state.service';

@Component({
  selector: 'app-upload',
  templateUrl: './upload.component.html',
  styleUrls: ['./upload.component.scss'],
})
export class UploadComponent implements OnInit {
  constructor() {}

  @Output() clicked = new EventEmitter<number>();

  ngOnInit(): void {}

  upload() {
    this.clicked.emit();
  }
}
