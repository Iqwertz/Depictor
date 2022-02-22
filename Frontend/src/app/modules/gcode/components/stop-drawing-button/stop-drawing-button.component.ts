import { Router } from '@angular/router';
import { GcodeViewerService } from './../../services/gcode-viewer.service';
import { Component, OnInit, ViewChild } from '@angular/core';
import { BackendConnectService } from '../../../../services/backend-connect.service';
import { ConfirmDialogComponent } from 'src/app/modules/shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-stop-drawing-button',
  templateUrl: './stop-drawing-button.component.html',
  styleUrls: ['./stop-drawing-button.component.scss'],
})
export class StopDrawingButtonComponent implements OnInit {
  constructor(
    private backendConnectService: BackendConnectService,
    private gcodeViewerService: GcodeViewerService,
    private router: Router
  ) {}
  @ViewChild('dialog', { static: false })
  confirmDialog: ConfirmDialogComponent | undefined;

  ngOnInit(): void {}

  stop() {
    this.backendConnectService.stop();
    this.router.navigate(['start']);
  }
}
