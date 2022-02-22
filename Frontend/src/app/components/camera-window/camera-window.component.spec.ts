import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CameraWindowComponent } from './camera-window.component';

describe('CameraWindowComponent', () => {
  let component: CameraWindowComponent;
  let fixture: ComponentFixture<CameraWindowComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CameraWindowComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CameraWindowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
