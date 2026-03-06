import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { IonicModule } from '@ionic/angular';
import { ReceiptActivityPage } from './receipt-activity.page';

describe('ReceiptActivityPage', () => {
  let component: ReceiptActivityPage;
  let fixture: ComponentFixture<ReceiptActivityPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ReceiptActivityPage],
      imports: [IonicModule.forRoot(), HttpClientTestingModule, RouterTestingModule],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ReceiptActivityPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
