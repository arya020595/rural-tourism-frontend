import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OperatorBookingsPage } from './operator-bookings.page';

describe('OperatorBookingsPage', () => {
  let component: OperatorBookingsPage;
  let fixture: ComponentFixture<OperatorBookingsPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(OperatorBookingsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
