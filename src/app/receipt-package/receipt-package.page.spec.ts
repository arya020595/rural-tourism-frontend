import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReceiptPackagePage } from './receipt-package.page';

describe('ReceiptPackagePage', () => {
  let component: ReceiptPackagePage;
  let fixture: ComponentFixture<ReceiptPackagePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ReceiptPackagePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
