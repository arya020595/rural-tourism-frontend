import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { ResetPasssPage } from './reset-passs.page';

describe('ResetPasssPage', () => {
  let component: ResetPasssPage;
  let fixture: ComponentFixture<ResetPasssPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ResetPasssPage],
      imports: [IonicModule.forRoot(), HttpClientTestingModule, RouterTestingModule, FormsModule],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ResetPasssPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
