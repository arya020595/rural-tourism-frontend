import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfirmBookingAccommodationDetailsPage } from './confirm-booking-accommodation-details.page';

describe('ConfirmBookingAccommodationDetailsPage', () => {
  let component: ConfirmBookingAccommodationDetailsPage;
  let fixture: ComponentFixture<ConfirmBookingAccommodationDetailsPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfirmBookingAccommodationDetailsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
