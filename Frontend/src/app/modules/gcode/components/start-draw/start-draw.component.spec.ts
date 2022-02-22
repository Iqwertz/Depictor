import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StartDrawComponent } from './start-draw.component';

describe('StartDrawComponent', () => {
  let component: StartDrawComponent;
  let fixture: ComponentFixture<StartDrawComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ StartDrawComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(StartDrawComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
