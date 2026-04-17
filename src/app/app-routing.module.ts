import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { authGuard } from './auth.guard';
import { loginRedirectGuard } from './login-redirect.guard';
import { permissionGuard } from './permission.guard';
import { roleGuard } from './role.guard';

const routes: Routes = [
  // {
  //   path: 'home',
  //   loadChildren: () => import('./home/home.module').then( m => m.HomePageModule),
  //   canActivate: [authGuard]  // Apply the authGuard to protect this route
  // },

  //This is the starting point when you run the code
  {
    path: 'tourist/home',
    loadChildren: () =>
      import('./tourist/home/home.module').then((m) => m.HomePageModule),
    canActivate: [authGuard, roleGuard, permissionGuard],
    data: {
      roles: ['tourist'],
      loginRole: 'tourist',
      permissions: ['activity:read', 'accommodation:read'],
    },
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadChildren: () =>
      import('./login/login.module').then((m) => m.LoginPageModule),
    canActivate: [loginRedirectGuard],
  },
  {
    path: 'unauthorized',
    loadChildren: () =>
      import('./unauthorized/unauthorized.module').then(
        (m) => m.UnauthorizedPageModule,
      ),
  },
  {
    path: 'acco-form',
    loadChildren: () =>
      import('./acco-form/acco-form.module').then((m) => m.AccoFormPageModule),
    canActivate: [authGuard, roleGuard, permissionGuard],
    data: {
      roles: ['operator'],
      loginRole: 'operator',
      permissions: ['accommodation:create'],
    },
  },
  {
    path: 'receipt/:receipt_id',
    loadChildren: () =>
      import('./receipt/receipt.module').then((m) => m.ReceiptPageModule),
    canActivate: [authGuard, roleGuard, permissionGuard],
    data: {
      roles: ['operator'],
      loginRole: 'operator',
      permissions: ['receipt:read'],
    },
  },
  {
    path: 'register',
    loadChildren: () =>
      import('./register/register.module').then((m) => m.RegisterPageModule),
    canActivate: [loginRedirectGuard],
  },
  {
    path: 'add-item',
    loadChildren: () =>
      import('./add-item/add-item.module').then((m) => m.AddItemPageModule),
    canActivate: [authGuard, roleGuard, permissionGuard],
    data: {
      roles: ['operator'],
      loginRole: 'operator',
      permissions: ['activity:create', 'accommodation:create'],
    },
  },
  {
    path: 'activity-form',
    loadChildren: () =>
      import('./activity-form/activity-form.module').then(
        (m) => m.ActivityFormPageModule,
      ),
    canActivate: [authGuard, roleGuard, permissionGuard],
    data: {
      roles: ['operator'],
      loginRole: 'operator',
      permissions: ['activity:create'],
    },
  },
  {
    path: 'receipt-activity/:receipt_id',
    loadChildren: () =>
      import('./receipt-activity/receipt-activity.module').then(
        (m) => m.ReceiptActivityPageModule,
      ),
    canActivate: [authGuard, roleGuard, permissionGuard],
    data: {
      roles: ['operator'],
      loginRole: 'operator',
      permissions: ['receipt:read'],
    },
  },
  {
    path: 'reset-passs',
    loadChildren: () =>
      import('./reset-passs/reset-passs.module').then(
        (m) => m.ResetPasssPageModule,
      ),
  },
  {
    path: 'forgot-password',
    loadChildren: () =>
      import('./reset-passs/reset-passs.module').then(
        (m) => m.ResetPasssPageModule,
      ),
  },
  {
    path: 'package-form',
    loadChildren: () =>
      import('./package-form/package-form.module').then(
        (m) => m.PackageFormPageModule,
      ),
    canActivate: [authGuard, roleGuard, permissionGuard],
    data: {
      roles: ['operator'],
      loginRole: 'operator',
      permissions: ['activity:create'],
    },
  },
  {
    path: 'receipt-package/:receipt_id',
    loadChildren: () =>
      import('./receipt-package/receipt-package.module').then(
        (m) => m.ReceiptPackagePageModule,
      ),
    canActivate: [authGuard, roleGuard, permissionGuard],
    data: {
      roles: ['operator'],
      loginRole: 'operator',
      permissions: ['receipt:read'],
    },
  },
  {
    path: 'transaction',
    loadChildren: () =>
      import('./transaction/transaction.module').then(
        (m) => m.TransactionPageModule,
      ),
    canActivate: [authGuard, roleGuard, permissionGuard],
    data: {
      roles: ['operator'],
      loginRole: 'operator',
      permissions: ['receipt:read'],
    },
  },
  {
    path: 'tourist/transaction',
    loadChildren: () =>
      import('./transaction/transaction.module').then(
        (m) => m.TransactionPageModule,
      ),
    canActivate: [authGuard, roleGuard, permissionGuard],
    data: {
      roles: ['tourist'],
      loginRole: 'tourist',
      permissions: ['receipt:read'],
    },
  },
  {
    path: 'view-receipt/:receipt_id',
    loadChildren: () =>
      import('./view-receipt/view-receipt.module').then(
        (m) => m.ViewReceiptPageModule,
      ),
    canActivate: [authGuard, roleGuard, permissionGuard],
    data: {
      roles: ['operator', 'tourist'],
      loginRole: 'operator',
      permissions: ['receipt:read'],
    },
  },
  {
    path: 'faq',
    loadChildren: () => import('./faq/faq.module').then((m) => m.FAQPageModule),
    canActivate: [authGuard],
  },
  {
    path: 'booking-home',
    loadChildren: () =>
      import('./booking-home/booking-home.module').then(
        (m) => m.BookingHomePageModule,
      ),
    canActivate: [authGuard, roleGuard, permissionGuard],
    data: {
      roles: ['tourist'],
      loginRole: 'tourist',
      permissions: ['booking:read'],
    },
  },
  {
    path: 'about',
    loadChildren: () =>
      import('./about/about.module').then((m) => m.AboutPageModule),
    canActivate: [authGuard],
  },
  {
    path: 'home',
    loadChildren: () =>
      import('./home/home.module').then((m) => m.HomePageModule),
    canActivate: [authGuard, roleGuard, permissionGuard],
    data: {
      roles: ['operator'],
      loginRole: 'operator',
      permissions: ['booking:read'],
    },
  },
  {
    path: 'company-profile',
    loadChildren: () =>
      import('./company-profile/company-profile.module').then(
        (m) => m.CompanyProfilePageModule,
      ),
    canActivate: [authGuard, roleGuard, permissionGuard],
    data: {
      roles: ['operator'],
      loginRole: 'operator',
      permissions: ['profile:read'],
    },
  },
  {
    path: 'e-receipt',
    loadChildren: () =>
      import('./e-receipt/e-receipt.module').then((m) => m.EReceiptPageModule),
    canActivate: [authGuard, roleGuard, permissionGuard],
    data: {
      roles: ['operator'],
      loginRole: 'operator',
      permissions: ['booking:read'],
    },
  },
  {
    path: 'tourist/faq',
    loadChildren: () =>
      import('./tourist/faq/faq.module').then((m) => m.FaqPageModule),
    canActivate: [authGuard, roleGuard],
    data: {
      roles: ['tourist'],
      loginRole: 'tourist',
    },
  },

  {
    path: 'tourist/activity-detail/:id',
    loadChildren: () =>
      import('./tourist/activity-detail/activity-detail.module').then(
        (m) => m.ActivityDetailPageModule,
      ),
    canActivate: [authGuard, roleGuard, permissionGuard],
    data: {
      roles: ['tourist'],
      loginRole: 'tourist',
      permissions: ['activity:read'],
    },
  },
  {
    path: 'tourist/accommodation-detail/:id',
    loadChildren: () =>
      import('./tourist/accomodation-detail/accomodation-detail.module').then(
        (m) => m.AccomodationDetailPageModule,
      ),
    canActivate: [authGuard, roleGuard, permissionGuard],
    data: {
      roles: ['tourist'],
      loginRole: 'tourist',
      permissions: ['accommodation:read'],
    },
  },
  {
    path: 'role',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'tourist/login',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'tourist/register',
    loadChildren: () =>
      import('./tourist/register/register.module').then(
        (m) => m.RegisterPageModule,
      ),
    canActivate: [loginRedirectGuard],
  },
  {
    path: 'tourist/activity-operator-list/:activityId',
    loadChildren: () =>
      import('./tourist/activity-operator-list/activity-operator-list.module').then(
        (m) => m.ActivityOperatorListPageModule,
      ),
    canActivate: [authGuard, roleGuard, permissionGuard],
    data: {
      roles: ['tourist'],
      loginRole: 'tourist',
      permissions: ['activity:read'],
    },
  },
  {
    path: 'activity-operator-detail/:id',
    loadChildren: () =>
      import('./tourist/activity-operator-detail/activity-operator-detail.module').then(
        (m) => m.ActivityOperatorDetailPageModule,
      ),
    canActivate: [authGuard, roleGuard, permissionGuard],
    data: {
      roles: ['tourist'],
      loginRole: 'tourist',
      permissions: ['activity:read'],
    },
  },

  {
    path: 'tourist/activity-booking',
    loadChildren: () =>
      import('./tourist/activity-booking/activity-booking.module').then(
        (m) => m.ActivityBookingPageModule,
      ),
    canActivate: [authGuard, roleGuard, permissionGuard],
    data: {
      roles: ['tourist'],
      loginRole: 'tourist',
      permissions: ['booking:create'],
    },
  },
  {
    path: 'tourist/confirm-booking-details',
    loadChildren: () =>
      import('./tourist/confirm-booking-details/confirm-booking-details.module').then(
        (m) => m.ConfirmBookingDetailsPageModule,
      ),
    canActivate: [authGuard, roleGuard, permissionGuard],
    data: {
      roles: ['tourist'],
      loginRole: 'tourist',
      permissions: ['booking:create'],
    },
  },
  {
    path: 'tourist/accommodation-booking',
    loadChildren: () =>
      import('./tourist/accommodation-booking/accommodation-booking.module').then(
        (m) => m.AccommodationBookingPageModule,
      ),
    canActivate: [authGuard, roleGuard, permissionGuard],
    data: {
      roles: ['tourist'],
      loginRole: 'tourist',
      permissions: ['booking:create'],
    },
  },
  {
    path: 'tourist/confirm-booking-accommodation-details',
    loadChildren: () =>
      import('./tourist/confirm-booking-accommodation-details/confirm-booking-accommodation-details.module').then(
        (m) => m.ConfirmBookingAccommodationDetailsPageModule,
      ),
    canActivate: [authGuard, roleGuard, permissionGuard],
    data: {
      roles: ['tourist'],
      loginRole: 'tourist',
      permissions: ['booking:create'],
    },
  },
  {
    path: 'notifications',
    loadChildren: () =>
      import('./notifications/notifications.module').then(
        (m) => m.NotificationsPageModule,
      ),
    canActivate: [authGuard, roleGuard, permissionGuard],
    data: {
      roles: ['operator'],
      loginRole: 'operator',
      permissions: ['booking:read'],
    },
  },
  {
    path: 'tourist/tourist-bookings',
    loadChildren: () =>
      import('./tourist/tourist-bookings/tourist-bookings.module').then(
        (m) => m.TouristBookingsPageModule,
      ),
    canActivate: [authGuard, roleGuard, permissionGuard],
    data: {
      roles: ['tourist'],
      loginRole: 'tourist',
      permissions: ['booking:read'],
    },
  },
  {
    path: 'operator-bookings',
    loadChildren: () =>
      import('./operator-bookings/operator-bookings.module').then(
        (m) => m.OperatorBookingsPageModule,
      ),
    canActivate: [authGuard, roleGuard, permissionGuard],
    data: {
      roles: ['operator'],
      loginRole: 'operator',
      permissions: ['booking:read'],
    },
  },
  {
    path: 'activity-and-accommodation-management',
    loadChildren: () =>
      import('./activity-and-accommodation-management/activity-and-accommodation-management.module').then(
        (m) => m.ActivityAndAccommodationManagementPageModule,
      ),
    canActivate: [authGuard, roleGuard, permissionGuard],
    data: {
      roles: ['operator'],
      loginRole: 'operator',
      permissions: ['activity:read', 'accommodation:read'],
    },
  },
  {
    path: 'association/dashboard',
    loadChildren: () =>
      import('./association/dashboard/dashboard.module').then(
        (m) => m.DashboardPageModule,
      ),
    canActivate: [authGuard, roleGuard, permissionGuard],
    data: {
      roles: ['association'],
      loginRole: 'association',
      permissions: ['association:read'],
    },
  },
  {
    path: 'association/login',
    redirectTo: 'login',
    pathMatch: 'full',
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      preloadingStrategy: PreloadAllModules,
      initialNavigation: 'enabledBlocking',
    }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
