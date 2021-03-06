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
  ],
})
export class SharedModule {}
