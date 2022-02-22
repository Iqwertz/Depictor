import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectLinesSliderComponent } from './select-lines-slider.component';

describe('SelectLinesSliderComponent', () => {
  let component: SelectLinesSliderComponent;
  let fixture: ComponentFixture<SelectLinesSliderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SelectLinesSliderComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SelectLinesSliderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
