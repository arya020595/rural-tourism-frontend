import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivityBookingPage } from './activity-booking.page';

describe('ActivityBookingPage', () => {
  let component: ActivityBookingPage;
  let fixture: ComponentFixture<ActivityBookingPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ActivityBookingPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
