import { Component, OnInit, ViewChild } from '@angular/core';
import { BackendConnectService } from '../../../../services/backend-connect.service';
import { GcodeViewerService } from '../../services/gcode-viewer.service';
import { Router } from '@angular/router';
import { ConfirmDialogComponent } from 'src/app/modules/shared/components/confirm-dialog/confirm-dialog.component';
import { LoadingService } from '../../../shared/services/loading.service';

@Component({
  selector: 'app-delete-button',
  templateUrl: './delete-button.component.html',
  styleUrls: ['./delete-button.component.scss'],
})
export class DeleteButtonComponent implements OnInit {
  constructor(
    private backendConnectService: BackendConnectService,
    private gcodeViewerService: GcodeViewerService,
    private router: Router,
    private loadingService: LoadingService
  ) {}

  @ViewChild('dialog', { static: false })
  confirmDialog: ConfirmDialogComponent | undefined;

  ngOnInit(): void {}

  del() {
    this.backendConnectService.delete(this.gcodeViewerService.gcodeId);
    this.loadingService.loadingText = 'removing Gcode';
    this.loadingService.isLoading = true;
    setTimeout(() => {
      //timeout to give the server some time to delete it
      this.loadingService.isLoading = false;
      this.router.navigate(['gcode', 'gallery']);
    }, 1000);
  }
}
