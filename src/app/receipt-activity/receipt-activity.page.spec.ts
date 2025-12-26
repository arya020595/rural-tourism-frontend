import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReceiptActivityPage } from './receipt-activity.page';

describe('ReceiptActivityPage', () => {
  let component: ReceiptActivityPage;
  let fixture: ComponentFixture<ReceiptActivityPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ReceiptActivityPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
