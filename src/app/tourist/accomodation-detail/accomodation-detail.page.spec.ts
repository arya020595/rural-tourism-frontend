import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { IonicModule } from '@ionic/angular';
import { AccomodationDetailPage } from './accomodation-detail.page';

describe('AccomodationDetailPage', () => {
  let component: AccomodationDetailPage;
  let fixture: ComponentFixture<AccomodationDetailPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AccomodationDetailPage],
      imports: [IonicModule.forRoot(), HttpClientTestingModule, RouterTestingModule],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(AccomodationDetailPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
