import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import {
  MultiToolState,
  SiteStateService,
  StateResponse,
} from '../../../../services/site-state.service';
import { BackendConnectService } from '../../../../services/backend-connect.service';
import { GcodeViewerService } from '../../services/gcode-viewer.service';
import { environment } from '../../../../../environments/environment';
import { Store } from '@ngxs/store';
import { SetAutoRouting } from '../../../../store/app.action';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { CanvasGcodeRendererComponent } from '../../components/canvas-gcode-renderer/canvas-gcode-renderer.component';

@Component({
  templateUrl: './drawing.component.html',
  styleUrls: ['./drawing.component.scss'],
})
export class DrawingComponent implements OnInit, AfterViewInit {
  constructor(
    private siteState: SiteStateService,
    private backendConnectService: BackendConnectService,
    private gcodeViewerService: GcodeViewerService,
    private store: Store,
    private router: Router
  ) {}

  @ViewChild(CanvasGcodeRendererComponent) renderer:
    | CanvasGcodeRendererComponent
    | undefined;

  isDrawing: boolean = false;
  multiToolState: MultiToolState | null = null;
  drawingProgress: number = 0;

  ngOnInit(): void {
    this.store.dispatch(new SetAutoRouting(false));
    this.updateDrawingProgress();
  }

  ngAfterViewInit(): void {
    this.checkDrawingState();
    setInterval(() => {
      this.checkDrawingState();
    }, environment.appStateCheckInterval);
  }

  checkDrawingState() {
    if (this.isDrawing) {
      return;
    }
    this.backendConnectService.getDrawenGcode().subscribe(
      (res: StateResponse) => {
        if (res.data && res.isDrawing) {
          this.gcodeViewerService.setGcodeFile(res.data, 'drawing', '');
          this.renderer?.renderGcode(this.gcodeViewerService.gcodeFile, {
            notRenderdLines: 0,
            drawing: true,
          });
        }
      },
      (error: HttpErrorResponse) => {
        if (error.status == 0) {
          this.siteState.serverOnline = false;
          console.log('Server Offline!');
          this.router.navigate(['']);
        }
      }
    );
    this.backendConnectService
      .checkProgress()
      .subscribe((res: StateResponse) => {
        console.log(res);
        this.isDrawing = res.isDrawing;
        if (!this.isDrawing) {
          this.drawingProgress = 0;
        }
        if (res.multiTool) {
          this.multiToolState = res.multiTool;
        } else {
          this.multiToolState = null;
        }
      });
  }

  updateDrawingProgress() {
    this.backendConnectService.checkDrawingProgress().subscribe((res: any) => {
      if (res.data) {
        if (res.data != -1) {
          this.renderer?.updateDrawingGcode(res.data);
        }
        this.drawingProgress = res.data;
      }

      if (res.multiToolState) {
        this.multiToolState = res.multiToolState;
      }
    });

    setTimeout(() => {
      this.updateDrawingProgress();
    }, 400);
  }
}
