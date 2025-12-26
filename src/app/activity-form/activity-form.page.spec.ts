import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivityFormPage } from './activity-form.page';

describe('ActivityFormPage', () => {
  let component: ActivityFormPage;
  let fixture: ComponentFixture<ActivityFormPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ActivityFormPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
