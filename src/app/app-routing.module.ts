import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { authGuard } from './auth.guard';

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
    // canActivate: [authGuard]  // Apply the authGuard to protect this route
  },
  {
    path: '',
    redirectTo: 'tourist/home',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadChildren: () =>
      import('./login/login.module').then((m) => m.LoginPageModule),
  },
  {
    path: 'acco-form',
    loadChildren: () =>
      import('./acco-form/acco-form.module').then((m) => m.AccoFormPageModule),
    canActivate: [authGuard],
  },
  {
    path: 'receipt/:receipt_id',
    loadChildren: () =>
      import('./receipt/receipt.module').then((m) => m.ReceiptPageModule),
    canActivate: [authGuard],
  },
  {
    path: 'register',
    loadChildren: () =>
      import('./register/register.module').then((m) => m.RegisterPageModule),
  },
  {
    path: 'add-item',
    loadChildren: () =>
      import('./add-item/add-item.module').then((m) => m.AddItemPageModule),
    canActivate: [authGuard],
  },
  {
    path: 'activity-form',
    loadChildren: () =>
      import('./activity-form/activity-form.module').then(
        (m) => m.ActivityFormPageModule,
      ),
    canActivate: [authGuard],
  },
  {
    path: 'receipt-activity/:receipt_id',
    loadChildren: () =>
      import('./receipt-activity/receipt-activity.module').then(
        (m) => m.ReceiptActivityPageModule,
      ),
    canActivate: [authGuard],
  },
  {
    path: 'reset-passs',
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
  },
  {
    path: 'receipt-package/:receipt_id',
    loadChildren: () =>
      import('./receipt-package/receipt-package.module').then(
        (m) => m.ReceiptPackagePageModule,
      ),
  },
  {
    path: 'transaction',
    loadChildren: () =>
      import('./transaction/transaction.module').then(
        (m) => m.TransactionPageModule,
      ),
  },
  {
    path: 'view-receipt/:receipt_id',
    loadChildren: () =>
      import('./view-receipt/view-receipt.module').then(
        (m) => m.ViewReceiptPageModule,
      ),
  },
  {
    path: 'faq',
    loadChildren: () => import('./faq/faq.module').then((m) => m.FAQPageModule),
  },
  {
    path: 'booking-home',
    loadChildren: () =>
      import('./booking-home/booking-home.module').then(
        (m) => m.BookingHomePageModule,
      ),
  },
  {
    path: 'about',
    loadChildren: () =>
      import('./about/about.module').then((m) => m.AboutPageModule),
  },
  {
    path: 'home',
    loadChildren: () =>
      import('./home/home.module').then((m) => m.HomePageModule),
  },
  {
    path: 'faq',
    loadChildren: () =>
      import('./tourist/faq/faq.module').then((m) => m.FaqPageModule),
  },

  {
    path: 'tourist/activity-detail/:id',
    loadChildren: () =>
      import('./tourist/activity-detail/activity-detail.module').then(
        (m) => m.ActivityDetailPageModule,
      ),
  },
  {
    path: 'tourist/accommodation-detail/:id',
    loadChildren: () =>
      import('./tourist/accomodation-detail/accomodation-detail.module').then(
        (m) => m.AccomodationDetailPageModule,
      ),
  },
  {
    path: 'role',
    loadChildren: () =>
      import('./role/role.module').then((m) => m.RolePageModule),
  },
  {
    path: 'tourist/login',
    loadChildren: () =>
      import('./tourist/login/login.module').then((m) => m.LoginPageModule),
  },
  {
    path: 'tourist/register',
    loadChildren: () =>
      import('./tourist/register/register.module').then(
        (m) => m.RegisterPageModule,
      ),
  },
  {
    path: 'tourist/activity-operator-list/:activityId',
    loadChildren: () =>
      import('./tourist/activity-operator-list/activity-operator-list.module').then(
        (m) => m.ActivityOperatorListPageModule,
      ),
  },
  {
    path: 'activity-operator-detail/:id',
    loadChildren: () =>
      import('./tourist/activity-operator-detail/activity-operator-detail.module').then(
        (m) => m.ActivityOperatorDetailPageModule,
      ),
  },

  {
    path: 'tourist/activity-booking',
    loadChildren: () =>
      import('./tourist/activity-booking/activity-booking.module').then(
        (m) => m.ActivityBookingPageModule,
      ),
  },
  {
    path: 'tourist/confirm-booking-details',
    loadChildren: () =>
      import('./tourist/confirm-booking-details/confirm-booking-details.module').then(
        (m) => m.ConfirmBookingDetailsPageModule,
      ),
  },
  {
    path: 'tourist/accommodation-booking',
    loadChildren: () =>
      import('./tourist/accommodation-booking/accommodation-booking.module').then(
        (m) => m.AccommodationBookingPageModule,
      ),
  },
  {
    path: 'tourist/confirm-booking-accommodation-details',
    loadChildren: () =>
      import('./tourist/confirm-booking-accommodation-details/confirm-booking-accommodation-details.module').then(
        (m) => m.ConfirmBookingAccommodationDetailsPageModule,
      ),
  },
  {
    path: 'notifications',
    loadChildren: () =>
      import('./notifications/notifications.module').then(
        (m) => m.NotificationsPageModule,
      ),
  },
  {
    path: 'tourist/tourist-bookings',
    loadChildren: () =>
      import('./tourist/tourist-bookings/tourist-bookings.module').then(
        (m) => m.TouristBookingsPageModule,
      ),
  },
  {
    path: 'operator-bookings',
    loadChildren: () =>
      import('./operator-bookings/operator-bookings.module').then(
        (m) => m.OperatorBookingsPageModule,
      ),
  },
  // {
  //   path: 'activity-and-accommodation-management',
  //   loadChildren: () => import('./activity-and-accommodation-management/activity-and-accommodation-management.module').then( m => m.ActivityAndAccommodationManagementPageModule)
  // },

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
