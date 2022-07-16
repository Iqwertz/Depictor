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

@NgModule({
  declarations: [
    NavbarComponent,
    LoadingComponent,
    SettingsButtonComponent,
    SettingsComponent,
    ConfirmDialogComponent,
    TerminalButtonComponent,
  ],
  imports: [
    CommonModule,
    FontAwesomeModule,
    MatCheckboxModule,
    FormsModule,
    ReactiveFormsModule,
    MatSelectModule,
  ],
  exports: [
    NavbarComponent,
    LoadingComponent,
    SettingsButtonComponent,
    ConfirmDialogComponent,
    TerminalButtonComponent,
  ],
})
export class SharedModule {}
