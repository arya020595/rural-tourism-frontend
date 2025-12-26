import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AccommodationBookingPage } from './accommodation-booking.page';

describe('AccommodationBookingPage', () => {
  let component: AccommodationBookingPage;
  let fixture: ComponentFixture<AccommodationBookingPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AccommodationBookingPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
