import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { IonicModule } from '@ionic/angular';
import { ReceiptPackagePage } from './receipt-package.page';

describe('ReceiptPackagePage', () => {
  let component: ReceiptPackagePage;
  let fixture: ComponentFixture<ReceiptPackagePage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ReceiptPackagePage],
      imports: [IonicModule.forRoot(), HttpClientTestingModule, RouterTestingModule],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ReceiptPackagePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
