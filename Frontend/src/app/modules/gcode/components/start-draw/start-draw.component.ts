import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { SiteStateService } from '../../../../services/site-state.service';

@Component({
  selector: 'app-start-draw',
  templateUrl: './start-draw.component.html',
  styleUrls: ['./start-draw.component.scss'],
})
export class StartDrawComponent implements OnInit {
  constructor(public siteStateService: SiteStateService) {}

  @Output() clicked = new EventEmitter<number>();

  ngOnInit(): void {}

  startDraw() {
    if (this.siteStateService.appState.isDrawing) {
      //error message
      return;
    }

    this.clicked.emit();
  }
}
