import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AssociationDashboardPage } from './dashboard.page';

describe('DashboardPage', () => {
  let component: AssociationDashboardPage;
  let fixture: ComponentFixture<AssociationDashboardPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AssociationDashboardPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
