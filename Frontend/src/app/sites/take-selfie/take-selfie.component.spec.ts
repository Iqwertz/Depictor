import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TakeSelfieComponent } from './take-selfie.component';

describe('TakeSelfieComponent', () => {
  let component: TakeSelfieComponent;
  let fixture: ComponentFixture<TakeSelfieComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TakeSelfieComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TakeSelfieComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
