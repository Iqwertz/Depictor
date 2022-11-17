import { Component, forwardRef, Input, OnInit } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-select-chip',
  templateUrl: './select-chip.component.html',
  styleUrls: ['./select-chip.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectChipComponent),
      multi: true,
    },
  ],
})
export class SelectChipComponent implements OnInit {
  @Input('label') label: string = '';

  @Input('options') options: string[] = [];
  selectedOption: string = '';

  // Allow the input to be disabled.
  @Input() disabled = false;

  constructor() {}

  ngOnInit(): void {}

  onChange = (option: string) => {};

  // Function to call when the input is touched.
  onTouched = () => {};

  get value(): string {
    return this.selectedOption;
  }

  // Allows Angular to update the model.
  // Update the model and changes needed for the view here.
  writeValue(option: string): void {
    this.selectedOption = option;
    this.onChange(this.selectedOption);
  }

  // Allows Angular to register a function to call when the model changes.
  // Save the function as a property to call later here.
  registerOnChange(fn: (option: string) => void): void {
    this.onChange = fn;
  }

  // Allows Angular to register a function to call when the input has been touched.
  // Save the function as a property to call later here.
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  // Allows Angular to disable the input.
  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onModelChange(): void {
    this.onChange(this.selectedOption);
  }
}
