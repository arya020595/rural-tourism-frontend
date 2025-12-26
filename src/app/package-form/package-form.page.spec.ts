import { ComponentFixture, TestBed } from '@angular/core/testing';
import {PackageFormPage } from './package-form.page';

describe('PackageFormPage', () => {
  let component: PackageFormPage;
  let fixture: ComponentFixture<PackageFormPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(PackageFormPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
