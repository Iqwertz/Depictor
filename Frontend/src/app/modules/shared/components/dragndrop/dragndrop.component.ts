import { Component, OnInit, HostListener } from '@angular/core';
import { faCloudArrowUp } from '@fortawesome/free-solid-svg-icons';
import { FileUploadService } from '../../../../services/file-upload.service';

@Component({
  selector: 'app-dragndrop',
  templateUrl: './dragndrop.component.html',
  styleUrls: ['./dragndrop.component.scss'],
})
export class DragndropComponent implements OnInit {
  uploadIcon = faCloudArrowUp;
  dropzoneHovered = false;

  constructor(private fileUploadService: FileUploadService) {}

  ngOnInit(): void {}

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
      this.fileUploadService.parseFile(event.dataTransfer.files[0]);
    }
  }

  @HostListener('window:dragover', ['$event'])
  onDragOver(event: any) {
    event.preventDefault();
  }
}
