import { Component, OnInit, forwardRef, Input } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-settings-checkbox',
  templateUrl: './settings-checkbox.component.html',
  styleUrls: ['./settings-checkbox.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SettingsCheckboxComponent),
      multi: true,
    },
  ],
})
export class SettingsCheckboxComponent implements OnInit {
  constructor() {}

  checked: boolean = false;

  ngOnInit(): void {}

  // Allow the input to be disabled.
  @Input() disabled = false;

  onChange = (checked: boolean) => {};

  // Function to call when the input is touched.
  onTouched = () => {};

  get value(): boolean {
    return this.checked;
  }

  // Allows Angular to update the model.
  // Update the model and changes needed for the view here.
  writeValue(checked: boolean): void {
    this.checked = checked;
    this.onChange(this.checked);
  }

  // Allows Angular to register a function to call when the model changes.
  // Save the function as a property to call later here.
  registerOnChange(fn: (checked: boolean) => void): void {
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
    this.onChange(this.checked);
  }
}
