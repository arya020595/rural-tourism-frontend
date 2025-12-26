import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivityOperatorDetailPage } from './activity-operator-detail.page';

describe('ActivityOperatorDetailPage', () => {
  let component: ActivityOperatorDetailPage;
  let fixture: ComponentFixture<ActivityOperatorDetailPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ActivityOperatorDetailPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
