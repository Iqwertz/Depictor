import { Component, Input, OnInit } from '@angular/core';
import { faDownload } from '@fortawesome/free-solid-svg-icons';
import { Select } from '@ngxs/store';
import { BackendConnectService } from 'src/app/services/backend-connect.service';
import { AppState } from 'src/app/store/app.state';

@Component({
  selector: 'app-download-button',
  templateUrl: './download-button.component.html',
  styleUrls: ['./download-button.component.scss'],
})
export class DownloadButtonComponent implements OnInit {
  faDownload = faDownload;
  downloadableFileTypes: string[] = [];

  @Select(AppState.ip)
  ip$: any;
  ip: string = '';

  @Input() fileId: string = '';

  constructor(private backendConnectService: BackendConnectService) {}

  ngOnInit(): void {
    this.ip$.subscribe((ip: string) => {
      this.ip = ip;
    });

    this.backendConnectService
      .getAvailableFileTypes(this.fileId)
      .subscribe((res: any) => {
        this.downloadableFileTypes = res.fileTypes;
      });
  }
}
