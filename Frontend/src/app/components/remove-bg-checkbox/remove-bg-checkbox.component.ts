import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { SiteStateService } from '../../services/site-state.service';

@Component({
  selector: 'app-remove-bg-checkbox',
  templateUrl: './remove-bg-checkbox.component.html',
  styleUrls: ['./remove-bg-checkbox.component.scss'],
})
export class RemoveBgCheckboxComponent implements OnInit {
  @Output() buttonChange = new EventEmitter<boolean>();
  checkBoxState: boolean = false;

  constructor(public siteStateService: SiteStateService) {}

  ngOnInit(): void {}

  buttonChanged() {
    this.buttonChange.emit(this.checkBoxState);
  }
}
