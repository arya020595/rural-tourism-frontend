import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivityOperatorListPage } from './activity-operator-list.page';

describe('ActivityOperatorListPage', () => {
  let component: ActivityOperatorListPage;
  let fixture: ComponentFixture<ActivityOperatorListPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ActivityOperatorListPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
