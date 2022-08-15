import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-paper-profile-popup',
  templateUrl: './paper-profile-popup.component.html',
  styleUrls: ['./paper-profile-popup.component.scss'],
})
export class PaperProfilePopupComponent implements OnInit {
  name: string = '';

  constructor() {}

  ngOnInit(): void {}
}
