import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from './components/navbar/navbar.component';
import { LoadingComponent } from './components/loading/loading.component';
import { SettingsButtonComponent } from './components/settings-button/settings-button.component';
import { SettingsComponent } from './components/settings/settings.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FormsModule } from '@angular/forms';
import { ConfirmDialogComponent } from './components/confirm-dialog/confirm-dialog.component';

@NgModule({
  declarations: [
    NavbarComponent,
    LoadingComponent,
    SettingsButtonComponent,
    SettingsComponent,
    ConfirmDialogComponent,
  ],
  imports: [CommonModule, FontAwesomeModule, FormsModule],
  exports: [
    NavbarComponent,
    LoadingComponent,
    SettingsButtonComponent,
    ConfirmDialogComponent,
  ],
})
export class SharedModule {}
