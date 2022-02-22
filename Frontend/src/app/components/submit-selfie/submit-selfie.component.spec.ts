import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SubmitSelfieComponent } from './submit-selfie.component';

describe('SubmitSelfieComponent', () => {
  let component: SubmitSelfieComponent;
  let fixture: ComponentFixture<SubmitSelfieComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SubmitSelfieComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SubmitSelfieComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
