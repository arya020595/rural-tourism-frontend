import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { AccoFormPage } from './acco-form.page';

describe('AccoFormPage', () => {
  let component: AccoFormPage;
  let fixture: ComponentFixture<AccoFormPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AccoFormPage],
      imports: [IonicModule.forRoot(), HttpClientTestingModule, RouterTestingModule, FormsModule],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(AccoFormPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
