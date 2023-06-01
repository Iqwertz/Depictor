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

  ngOnInit(): void {}

  continueDrawing() {
    this.backendConnectService.continueMultiTool();
  }

  getToolMessage(multiToolState: MultiToolState | null): string {
    if (!multiToolState) return '';
    let id = multiToolState?.currentGcodeId;
    let toolMessage = '';

    if (id && id > 0) {
      toolMessage = multiToolState?.multiToolGcodes[id - 1].message;
    }

    return toolMessage;
  }

  getColor(multiToolState: MultiToolState | null): string {
    if (!multiToolState) return '';
    let id = multiToolState?.currentGcodeId;
    let color = '';

    if (id && id > 0) {
      color = multiToolState?.multiToolGcodes[id - 1].color;
    }

    return color;
  }
}
