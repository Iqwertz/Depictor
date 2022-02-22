import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SelfieDisplayComponent } from './selfie-display.component';

describe('SelfieDisplayComponent', () => {
  let component: SelfieDisplayComponent;
  let fixture: ComponentFixture<SelfieDisplayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SelfieDisplayComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SelfieDisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
