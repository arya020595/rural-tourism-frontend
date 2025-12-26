import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ResetPasssPage } from './reset-passs.page';

describe('ResetPasssPage', () => {
  let component: ResetPasssPage;
  let fixture: ComponentFixture<ResetPasssPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ResetPasssPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
