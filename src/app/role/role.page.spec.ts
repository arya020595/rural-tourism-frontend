import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RolePage } from './role.page';

describe('RolePage', () => {
  let component: RolePage;
  let fixture: ComponentFixture<RolePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(RolePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
