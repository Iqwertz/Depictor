import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CameraTriggerComponent } from './camera-trigger.component';

describe('CameraTriggerComponent', () => {
  let component: CameraTriggerComponent;
  let fixture: ComponentFixture<CameraTriggerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CameraTriggerComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CameraTriggerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
