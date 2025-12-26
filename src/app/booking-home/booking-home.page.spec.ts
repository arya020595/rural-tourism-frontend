import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BookingHomePage } from './booking-home.page';

describe('BookingHomePage', () => {
  let component: BookingHomePage;
  let fixture: ComponentFixture<BookingHomePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(BookingHomePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
