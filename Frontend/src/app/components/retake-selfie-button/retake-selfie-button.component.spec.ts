import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RetakeSelfieButtonComponent } from './retake-selfie-button.component';

describe('RetakeSelfieButtonComponent', () => {
  let component: RetakeSelfieButtonComponent;
  let fixture: ComponentFixture<RetakeSelfieButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RetakeSelfieButtonComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RetakeSelfieButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
