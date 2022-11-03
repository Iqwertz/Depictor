import { Component, OnInit, HostListener } from '@angular/core';
import { faCloudArrowUp } from '@fortawesome/free-solid-svg-icons';
import { Select } from '@ngxs/store';
import { AppState } from 'src/app/store/app.state';
import { environment } from 'src/environments/environment.prod';
import { FileUploadService } from '../../../../services/file-upload.service';
import { ConverterConfig, Settings } from '../settings/settings.component';

@Component({
  selector: 'app-dragndrop',
  templateUrl: './dragndrop.component.html',
  styleUrls: ['./dragndrop.component.scss'],
})
export class DragndropComponent implements OnInit {
  uploadIcon = faCloudArrowUp;
  dropzoneHovered = false;

  @Select(AppState.settings) settings$: any;
  settings: Settings = JSON.parse(JSON.stringify(environment.defaultSettings));

  constructor(private fileUploadService: FileUploadService) {}

  ngOnInit(): void {
    this.settings$.subscribe((settings: Settings) => {
      this.settings = settings;
    });
  }

  @HostListener('window:dragleave', ['$event'])
  onDragLeave(e: any) {
    if (!e.fromElement) {
      // this will ensure that you are not in the browser anymore
      this.dropzoneHovered = false;
    }
  }

  @HostListener('window:dragenter', ['$event'])
  onDragEnter(e: any) {
    if (!e.fromElement) {
      // this will ensure that you are not in the browser anymore
      this.dropzoneHovered = true;
    }
  }

  @HostListener('window:drop', ['$event'])
  onDropSuccess(event: any) {
    event.preventDefault();
    event.stopPropagation();
    this.dropzoneHovered = false;
    if (!event.fromElement) {
      // this will ensure that you are not in the browser anymore
      let config: ConverterConfig | undefined =
        this.settings.converter.availableConverter.find(
          (x) => x.name === this.settings.converter.selectedConverter
        );
      if (!config) {
        config = this.settings.converter.availableConverter[0];
      }

      this.fileUploadService.parseFile(event.dataTransfer.files[0], config);
    }
  }

  @HostListener('window:dragover', ['$event'])
  onDragOver(event: any) {
    event.preventDefault();
  }
}
