import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfirmBookingDetailsPage } from './confirm-booking-details.page';

describe('ConfirmBookingDetailsPage', () => {
  let component: ConfirmBookingDetailsPage;
  let fixture: ComponentFixture<ConfirmBookingDetailsPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfirmBookingDetailsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
