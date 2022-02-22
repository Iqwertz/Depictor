import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CancleButtonComponent } from './cancle-button.component';

describe('CancleButtonComponent', () => {
  let component: CancleButtonComponent;
  let fixture: ComponentFixture<CancleButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CancleButtonComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CancleButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
