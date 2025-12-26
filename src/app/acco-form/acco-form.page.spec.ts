import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AccoFormPage } from './acco-form.page';

describe('AccoFormPage', () => {
  let component: AccoFormPage;
  let fixture: ComponentFixture<AccoFormPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AccoFormPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
