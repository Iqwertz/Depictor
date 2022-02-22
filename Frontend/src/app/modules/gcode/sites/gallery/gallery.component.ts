import { Component, OnInit, HostListener } from '@angular/core';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { Router } from '@angular/router';
import { BackendConnectService } from '../../../../services/backend-connect.service';
import { Store } from '@ngxs/store';
import { SetAutoRouting } from '../../../../store/app.action';
import { GcodeViewerService } from '../../services/gcode-viewer.service';
import { LoadingService } from '../../../shared/services/loading.service';

export interface GcodeEntry {
  image: string;
  name: string;
}

@Component({
  templateUrl: './gallery.component.html',
  styleUrls: ['./gallery.component.scss'],
})
export class GalleryComponent implements OnInit {
  faTimes = faTimes;

  gallery: GcodeEntry[] = [];

  loadedElements: number = 0;
  loadedAll: boolean = false;
  loading: boolean = false;

  autoLoadMoreDiffrence: number = 1000;
  elementLoadAmount: number = 6;

  constructor(
    private router: Router,
    private store: Store,
    private backendConnectService: BackendConnectService,
    private gcodeViewerService: GcodeViewerService,
    private loadingService: LoadingService
  ) {}

  ngOnInit(): void {
    if (
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      )
    ) {
      this.elementLoadAmount = 3;
    }
    this.loadMore(this.elementLoadAmount);
    this.store.dispatch(new SetAutoRouting(false));
    this.loadingService.isLoading = false;
  }

  @HostListener('window:scroll', [])
  onScroll(): void {
    if (
      this.getScrollHeight() - this.getYPosition() <=
      this.autoLoadMoreDiffrence
    ) {
      this.loadMore(this.elementLoadAmount);
    }
  }

  loadMore(amount: number) {
    if (this.loadedAll || this.loading) {
      return;
    }

    this.loading = true;
    this.backendConnectService
      .getGallery([this.loadedElements, this.loadedElements + amount])
      .subscribe((res: any) => {
        this.gallery = this.gallery.concat(res.data);
        console.log(res.length);
        if (res.data.length < amount) {
          this.loadedAll = true;
        }
        this.loading = false;
      });
    this.loadedElements += amount;
  }

  close() {
    this.store.dispatch(new SetAutoRouting(true));
    this.router.navigate(['']);
  }

  loadGcodeById(id: string) {
    this.loadingService.isLoading = true;
    this.loadingService.loadingText = 'loading Data';
    this.backendConnectService.getGcodeById(id).subscribe((data: any) => {
      this.loadingService.isLoading = false;
      if (data.err) {
        //error
        console.log(data.err);
      } else {
        this.gcodeViewerService.gcodeId = id;
        this.gcodeViewerService.setGcodeFile(data.data, false);
        this.router.navigate(['gcode', 'editGcode']);
      }
    });
  }

  getYPosition(): number {
    return this.getScrollingElement().scrollTop;
  }

  getScrollingElement(): Element {
    return document.scrollingElement || document.documentElement;
  }

  getScrollHeight(): number {
    return this.getScrollingElement().scrollHeight;
  }
}
