import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TouristBookingsPage } from './tourist-bookings.page';

describe('TouristBookingsPage', () => {
  let component: TouristBookingsPage;
  let fixture: ComponentFixture<TouristBookingsPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(TouristBookingsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
