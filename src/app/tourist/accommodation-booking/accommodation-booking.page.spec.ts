import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { IonicModule } from '@ionic/angular';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AccommodationBookingPage } from './accommodation-booking.page';

describe('AccommodationBookingPage', () => {
  let component: AccommodationBookingPage;
  let fixture: ComponentFixture<AccommodationBookingPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AccommodationBookingPage],
      imports: [IonicModule.forRoot(), HttpClientTestingModule, RouterTestingModule, FormsModule, ReactiveFormsModule],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(AccommodationBookingPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
