import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ViewReceiptPage } from './view-receipt.page';

describe('ViewReceiptPage', () => {
  let component: ViewReceiptPage;
  let fixture: ComponentFixture<ViewReceiptPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ViewReceiptPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
