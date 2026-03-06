import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { IonicModule } from '@ionic/angular';
import { ActivityDetailPage } from './activity-detail.page';

describe('ActivityDetailPage', () => {
  let component: ActivityDetailPage;
  let fixture: ComponentFixture<ActivityDetailPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ActivityDetailPage],
      imports: [IonicModule.forRoot(), HttpClientTestingModule, RouterTestingModule],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ActivityDetailPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
