import { Component, OnInit, forwardRef, Input } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-settings-textarea',
  templateUrl: './settings-textarea.component.html',
  styleUrls: ['./settings-textarea.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SettingsTextareaComponent),
      multi: true,
    },
  ],
})
export class SettingsTextareaComponent implements OnInit {
  constructor() {}

  text: string = '';

  ngOnInit(): void {}

  // Allow the input to be disabled.
  @Input() type: string = 'text';
  @Input() disabled = false;

  onChange = (text: string) => {};

  // Function to call when the input is touched.
  onTouched = () => {};

  get value(): string {
    return this.text;
  }

  // Allows Angular to update the model.
  // Update the model and changes needed for the view here.
  writeValue(text: string): void {
    this.text = text;
    this.onChange(this.text);
  }

  // Allows Angular to register a function to call when the model changes.
  // Save the function as a property to call later here.
  registerOnChange(fn: (text: string) => void): void {
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
    this.onChange(this.text);
  }
}
