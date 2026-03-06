import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { ConfirmBookingAccommodationDetailsPage } from './confirm-booking-accommodation-details.page';

describe('ConfirmBookingAccommodationDetailsPage', () => {
  let component: ConfirmBookingAccommodationDetailsPage;
  let fixture: ComponentFixture<ConfirmBookingAccommodationDetailsPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ConfirmBookingAccommodationDetailsPage],
      imports: [IonicModule.forRoot(), HttpClientTestingModule, RouterTestingModule, FormsModule],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmBookingAccommodationDetailsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
