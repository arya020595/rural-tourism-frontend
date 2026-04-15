import {
  Directive,
  Input,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewContainerRef,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { PermissionService } from '../services/permission.service';
import { AuthService } from '../services/auth.service';

@Directive({
  selector: '[hasPermission]',
})
export class HasPermissionDirective implements OnInit, OnDestroy {
  @Input('hasPermission') permission!: string | string[];

  private authSubscription?: Subscription;

  constructor(
    private templateRef: TemplateRef<unknown>,
    private viewContainer: ViewContainerRef,
    private permissionService: PermissionService,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.updateView();
    this.authSubscription = this.authService.currentUser$.subscribe(() => {
      this.updateView();
    });
  }

  ngOnDestroy(): void {
    this.authSubscription?.unsubscribe();
  }

  private updateView(): void {
    const required = Array.isArray(this.permission)
      ? this.permission
      : [this.permission];

    const canAccess =
      required.length > 0 && this.permissionService.hasAnyPermission(required);

    this.viewContainer.clear();
    if (canAccess) {
      this.viewContainer.createEmbeddedView(this.templateRef);
    }
  }
}
