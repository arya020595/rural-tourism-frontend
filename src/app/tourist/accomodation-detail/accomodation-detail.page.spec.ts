import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AccomodationDetailPage } from './accomodation-detail.page';

describe('AccomodationDetailPage', () => {
  let component: AccomodationDetailPage;
  let fixture: ComponentFixture<AccomodationDetailPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AccomodationDetailPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
