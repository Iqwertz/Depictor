import { Component, OnInit, HostListener } from '@angular/core';
import { faCloudArrowUp } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-dragndrop',
  templateUrl: './dragndrop.component.html',
  styleUrls: ['./dragndrop.component.scss']
})
export class DragndropComponent implements OnInit {

    uploadIcon = faCloudArrowUp;
  dropzoneHovered = false;

  constructor() { }

  ngOnInit(): void {
  }

    @HostListener("window:dragleave", ["$event"])
  onDragLeave(e:any) {
    if (!e.fromElement) {  // this will ensure that you are not in the browser anymore
      this.dropzoneHovered = false;
    }
  }

    @HostListener("window:dragenter", ["$event"])
  onDragEnter(e:any) {
    if (!e.fromElement) {  // this will ensure that you are not in the browser anymore
      this.dropzoneHovered = true;
    }
  }
      @HostListener("window:drop", ["$event"])
 onDropSuccess(event: any){
    event.preventDefault();
    this.dropzoneHovered = false;
if (!event.fromElement) {  // this will ensure that you are not in the browser anymore
    this.onFileChange(event.dataTransfer.files);    // notice the "dataTransfer" used instead of "target"
    }
  }

  onDragOver(event:any) {
    event.preventDefault();
}

  private onFileChange(files: File[]) {
  console.log(files)
  }
}
