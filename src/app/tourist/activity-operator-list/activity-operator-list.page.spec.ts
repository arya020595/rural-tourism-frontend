import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { IonicModule } from '@ionic/angular';
import { ActivityOperatorListPage } from './activity-operator-list.page';

describe('ActivityOperatorListPage', () => {
  let component: ActivityOperatorListPage;
  let fixture: ComponentFixture<ActivityOperatorListPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ActivityOperatorListPage],
      imports: [IonicModule.forRoot(), HttpClientTestingModule, RouterTestingModule],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ActivityOperatorListPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
