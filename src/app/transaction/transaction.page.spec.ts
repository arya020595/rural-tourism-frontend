import { HttpClientTestingModule } from '@angular/common/http/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { IonicModule } from '@ionic/angular';
import { TransactionPage } from './transaction.page';

describe('TransactionPage', () => {
  let component: TransactionPage;
  let fixture: ComponentFixture<TransactionPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TransactionPage],
      imports: [
        IonicModule.forRoot(),
        HttpClientTestingModule,
        RouterTestingModule,
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(TransactionPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
