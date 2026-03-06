import { HttpClientTestingModule } from '@angular/common/http/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { IonicModule } from '@ionic/angular';
import { ActivityOperatorDetailPage } from './activity-operator-detail.page';

describe('ActivityOperatorDetailPage', () => {
  let component: ActivityOperatorDetailPage;
  let fixture: ComponentFixture<ActivityOperatorDetailPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ActivityOperatorDetailPage],
      imports: [
        IonicModule.forRoot(),
        HttpClientTestingModule,
        RouterTestingModule,
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ActivityOperatorDetailPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
