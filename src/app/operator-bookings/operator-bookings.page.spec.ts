import { HttpClientTestingModule } from '@angular/common/http/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { IonicModule } from '@ionic/angular';
import { OperatorBookingsPage } from './operator-bookings.page';

describe('OperatorBookingsPage', () => {
  let component: OperatorBookingsPage;
  let fixture: ComponentFixture<OperatorBookingsPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [OperatorBookingsPage],
      imports: [
        IonicModule.forRoot(),
        HttpClientTestingModule,
        RouterTestingModule,
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(OperatorBookingsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
