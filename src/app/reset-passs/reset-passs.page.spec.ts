import { HttpClientTestingModule } from '@angular/common/http/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { IonicModule, ToastController } from '@ionic/angular';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { ApiService } from '../services/api.service';
import { ResetPasssPage } from './reset-passs.page';

describe('ResetPasssPage', () => {
  let component: ResetPasssPage;
  let fixture: ComponentFixture<ResetPasssPage>;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;
  let queryParamsSubject: BehaviorSubject<Record<string, string>>;
  let router: Router;
  let toastCtrl: ToastController;

  beforeEach(async () => {
    queryParamsSubject = new BehaviorSubject<Record<string, string>>({});
    apiServiceSpy = jasmine.createSpyObj('ApiService', [
      'requestPasswordReset',
      'resetPasswordWithToken',
    ]);

    await TestBed.configureTestingModule({
      declarations: [ResetPasssPage],
      imports: [
        IonicModule.forRoot(),
        HttpClientTestingModule,
        RouterTestingModule,
        FormsModule,
      ],
      providers: [
        { provide: ApiService, useValue: apiServiceSpy },
        {
          provide: ActivatedRoute,
          useValue: { queryParams: queryParamsSubject.asObservable() },
        },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    router = TestBed.inject(Router);
    toastCtrl = TestBed.inject(ToastController);
    spyOn(router, 'navigate').and.resolveTo(true);
    spyOn(toastCtrl, 'create').and.resolveTo({ present: () => Promise.resolve() } as any);

    fixture = TestBed.createComponent(ResetPasssPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('query-param initialization', () => {
    it('should default to "request" mode when no token is present', () => {
      queryParamsSubject.next({ email: 'user@example.com' });
      expect(component.viewMode).toBe('request');
      expect(component.email).toBe('user@example.com');
    });

    it('should set viewMode to "reset" when a token is present', () => {
      queryParamsSubject.next({ email: 'user@example.com', token: 'abc123' });
      expect(component.viewMode).toBe('reset');
      expect(component.resetToken).toBe('abc123');
    });

    it('should navigate to /login when step=reset but token is missing', () => {
      queryParamsSubject.next({ step: 'reset' });
      expect(router.navigate).toHaveBeenCalledWith(['/login'], {
        replaceUrl: true,
      });
    });
  });

  describe('sendResetLink', () => {
    it('should call the API, reset the loading flag and open the alert on success', fakeAsync(() => {
      apiServiceSpy.requestPasswordReset.and.returnValue(of({}));
      component.email = 'test@example.com';
      const mockForm = { valid: true } as any;

      component.sendResetLink(mockForm);
      tick();

      expect(apiServiceSpy.requestPasswordReset).toHaveBeenCalledWith(
        'test@example.com',
      );
      expect(component.isSendingResetLink).toBeFalse();
      expect(component.emailSentAlertOpen).toBeTrue();
    }));

    it('should reset isSendingResetLink and not open alert on error', fakeAsync(() => {
      apiServiceSpy.requestPasswordReset.and.returnValue(
        throwError(() => new Error('fail')),
      );
      component.email = 'bad@example.com';
      const mockForm = { valid: true } as any;

      component.sendResetLink(mockForm);
      tick();

      expect(component.isSendingResetLink).toBeFalse();
      expect(component.emailSentAlertOpen).toBeFalse();
    }));

    it('should not call the API when the form is invalid', () => {
      component.sendResetLink({ valid: false } as any);
      expect(apiServiceSpy.requestPasswordReset).not.toHaveBeenCalled();
    });
  });

  describe('submitNewPassword', () => {
    it('should call the API when passwords match and token is present', fakeAsync(() => {
      apiServiceSpy.resetPasswordWithToken.and.returnValue(of({}));
      component.resetToken = 'validtoken';
      component.newPassword = 'Password1!';
      component.confirmPassword = 'Password1!';
      const mockForm = { valid: true } as any;

      component.submitNewPassword(mockForm);
      tick();

      expect(apiServiceSpy.resetPasswordWithToken).toHaveBeenCalledWith(
        'validtoken',
        'Password1!',
      );
    }));

    it('should not call the API when passwords do not match', () => {
      component.resetToken = 'validtoken';
      component.newPassword = 'Password1!';
      component.confirmPassword = 'Different1!';

      component.submitNewPassword({ valid: true } as any);

      expect(apiServiceSpy.resetPasswordWithToken).not.toHaveBeenCalled();
    });

    it('should not call the API when the token is missing', () => {
      component.resetToken = '';
      component.newPassword = 'Password1!';
      component.confirmPassword = 'Password1!';

      component.submitNewPassword({ valid: true } as any);

      expect(apiServiceSpy.resetPasswordWithToken).not.toHaveBeenCalled();
    });
  });
});
