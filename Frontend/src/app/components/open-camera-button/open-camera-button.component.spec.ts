import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OpenCameraButtonComponent } from './open-camera-button.component';

describe('OpenCameraButtonComponent', () => {
  let component: OpenCameraButtonComponent;
  let fixture: ComponentFixture<OpenCameraButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OpenCameraButtonComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OpenCameraButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
