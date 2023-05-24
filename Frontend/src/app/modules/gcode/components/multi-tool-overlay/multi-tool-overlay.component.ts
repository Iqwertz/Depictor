import { Component, Input, OnInit } from '@angular/core';
import { BackendConnectService } from 'src/app/services/backend-connect.service';
import { MultiToolState } from 'src/app/services/site-state.service';

@Component({
  selector: 'app-multi-tool-overlay',
  templateUrl: './multi-tool-overlay.component.html',
  styleUrls: ['./multi-tool-overlay.component.scss'],
})
export class MultiToolOverlayComponent implements OnInit {
  @Input() multiToolState: MultiToolState | null = null;

  toolMessage: string | undefined = '';

  constructor(private backendConnectService: BackendConnectService) {}

  ngOnInit(): void {
    let id = this.multiToolState?.currentGcodeId;
    if (id && id > 0) {
      this.toolMessage = this.multiToolState?.multiToolGcodes[id - 1].message;
    }
  }

  continueDrawing() {
    this.backendConnectService.continueMultiTool();
  }
}
