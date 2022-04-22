import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';

@Component({
  selector: 'app-checkbox-chip',
  templateUrl: './checkbox-chip.component.html',
  styleUrls: ['./checkbox-chip.component.scss'],
})
export class CheckboxChipComponent implements OnInit {
  @Output() buttonChange = new EventEmitter<boolean>();
  checkBoxState: boolean = false;

  @Input('label') label: string = '';
  @Input('default') iniState: boolean = false;

  constructor() {}

  ngOnInit(): void {
    this.checkBoxState = this.iniState;
  }

  buttonChanged() {
    this.buttonChange.emit(this.checkBoxState);
  }
}
