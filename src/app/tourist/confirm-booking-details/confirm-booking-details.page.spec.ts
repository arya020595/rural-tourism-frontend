import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { ConfirmBookingDetailsPage } from './confirm-booking-details.page';

describe('ConfirmBookingDetailsPage', () => {
  let component: ConfirmBookingDetailsPage;
  let fixture: ComponentFixture<ConfirmBookingDetailsPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ConfirmBookingDetailsPage],
      imports: [IonicModule.forRoot(), HttpClientTestingModule, RouterTestingModule, FormsModule],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmBookingDetailsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
