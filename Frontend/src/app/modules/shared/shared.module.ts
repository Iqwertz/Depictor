import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from './components/navbar/navbar.component';
import { LoadingComponent } from './components/loading/loading.component';
import { SettingsButtonComponent } from './components/settings-button/settings-button.component';
import { SettingsComponent } from './components/settings/settings.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ConfirmDialogComponent } from './components/confirm-dialog/confirm-dialog.component';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { TerminalButtonComponent } from './components/terminal-button/terminal-button.component';
import { TerminalComponent } from './components/terminal/terminal.component';
import { NgTerminalModule } from 'ng-terminal';
import { DragndropComponent } from './components/dragndrop/dragndrop.component';
import { PaperProfilePopupComponent } from './components/paper-profile-popup/paper-profile-popup.component';
import { SettingsTextinputComponent } from './components/settings-ui/settings-textinput/settings-textinput.component';
import { SettingsTextareaComponent } from './components/settings-ui/settings-textarea/settings-textarea.component';
import { SettingsUiButtonComponent } from './components/settings-ui/settings-ui-button/settings-ui-button.component';
import { SettingsCheckboxComponent } from './components/settings-ui/settings-checkbox/settings-checkbox.component';
import { LogDisplayComponent } from './components/log-display/log-display.component';
import { JsonSettingsComponent } from './components/json-settings/json-settings.component';
import { SimpleLoaderComponent } from './components/simple-loader/simple-loader.component';

@NgModule({
  declarations: [
    NavbarComponent,
    LoadingComponent,
    SettingsButtonComponent,
    SettingsComponent,
    ConfirmDialogComponent,
    TerminalButtonComponent,
    TerminalComponent,
    DragndropComponent,
    PaperProfilePopupComponent,
    SettingsTextinputComponent,
    SettingsTextareaComponent,
    SettingsButtonComponent,
    SettingsUiButtonComponent,
    SettingsCheckboxComponent,
    LogDisplayComponent,
    JsonSettingsComponent,
    SimpleLoaderComponent,
  ],
  imports: [
    CommonModule,
    FontAwesomeModule,
    MatCheckboxModule,
    FormsModule,
    ReactiveFormsModule,
    MatSelectModule,
    NgTerminalModule,
  ],
  exports: [
    NavbarComponent,
    LoadingComponent,
    SettingsButtonComponent,
    ConfirmDialogComponent,
    TerminalButtonComponent,
    DragndropComponent,
    SimpleLoaderComponent,
    SettingsUiButtonComponent,
  ],
})
export class SharedModule {}
