import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

export type navBarNames = 'Create' | 'Gallery' | 'Drawing';

export interface NavBarEntry {
  name: navBarNames;
  active: boolean;
  routeTo: string[];
}
@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent implements OnInit {
  navBarEntrys: NavBarEntry[] = [
    {
      name: 'Create',
      active: false,
      routeTo: ['start'],
    },
    {
      name: 'Gallery',
      active: false,
      routeTo: ['gcode', 'gallery'],
    },
    {
      name: 'Drawing',
      active: false,
      routeTo: ['gcode', 'drawing'],
    },
  ];

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.setActive(this.router.url);
  }

  routeTo(route: string[]) {
    this.router.navigate(route);
  }

  private setActive(route: string) {
    switch (route) {
      case '/start':
        this.navBarEntrys.forEach((el: NavBarEntry) => {
          el.name == 'Create' ? (el.active = true) : (el.active = false);
        });
        break;
      case '/gcode/drawing':
        this.navBarEntrys.forEach((el: NavBarEntry) => {
          el.name == 'Drawing' ? (el.active = true) : (el.active = false);
        });
        break;
      case '/gcode/gallery':
        this.navBarEntrys.forEach((el: NavBarEntry) => {
          el.name == 'Gallery' ? (el.active = true) : (el.active = false);
        });
        break;
      case '/gcode/editGcode':
        this.navBarEntrys.forEach((el: NavBarEntry) => {
          el.name == 'Create' ? (el.active = true) : (el.active = false);
        });
        break;
    }
  }
}
