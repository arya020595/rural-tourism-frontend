import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MenuController } from '@ionic/angular';
import { BookingDetail } from '../booking-home/booking-home.models';
import { AuthService } from '../services/auth.service';
import { BookingStateService } from '../services/booking-state.service';
import { BookingService } from '../services/booking.service';
import { MenuItem, MenuService } from '../services/menu.service';
import { ToastService } from '../services/toast.service';

@Component({
  selector: 'app-booking-detail',
  templateUrl: './booking-detail.page.html',
  styleUrls: ['./booking-detail.page.scss'],
})
export class BookingDetailPage implements OnInit {
  user: any = null;
  menuItems: MenuItem[] = [];
  booking: BookingDetail | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private menuCtrl: MenuController,
    private menuService: MenuService,
    private authService: AuthService,
    private bookingService: BookingService,
    private bookingStateService: BookingStateService,
    private toastService: ToastService,
  ) {
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras?.state?.['booking']) {
      this.booking = navigation.extras.state['booking'];
    }
  }

  ngOnInit(): void {
    // Fall back to BookingStateService if router navigation state was lost
    // (common in Ionic lazy-loaded pages)
    if (!this.booking) {
      this.booking = this.bookingStateService.get();
    }
    this.loadUser();
  }

  ionViewWillEnter(): void {
    this.menuCtrl.enable(true, 'booking-detail-menu');
    this.loadUser();
  }

  onMenuItemTap(_item: MenuItem): void {
    this.menuCtrl.close('booking-detail-menu');
  }

  logOut(): void {
    this.authService.logout('/login');
    this.user = null;
    this.menuCtrl.enable(false, 'booking-detail-menu');
    this.menuCtrl.close('booking-detail-menu');
  }

  goBack(): void {
    this.router.navigate(['/booking-home']);
  }

  cancelBooking(): void {
    if (confirm('Are you sure you want to cancel this booking?')) {
      // TODO: Call service to cancel booking
      console.log('Cancelling booking:', this.booking?.id);
      this.goBack();
    }
  }

  editBooking(): void {
    // TODO: Navigate to edit booking page with pre-filled data
    console.log('Editing booking:', this.booking?.id);
    // this.router.navigate(['/booking-add'], { state: { booking: this.booking, mode: 'edit' } });
  }

  viewPaymentReceipt(): void {
    if (!this.booking?.numericId) {
      this.toastService.error('PDF receipt is not available for this booking.');
      return;
    }

    this.bookingService.downloadBookingPdf(this.booking.numericId).subscribe({
      next: (blob: Blob) => {
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `booking-${this.booking!.id ?? this.booking!.numericId}.pdf`;
        document.body.appendChild(anchor);
        anchor.click();
        setTimeout(() => {
          URL.revokeObjectURL(url);
          document.body.removeChild(anchor);
        }, 100);
      },
      error: (err) => {
        console.error('Failed to download booking PDF:', err);
        this.toastService.error('Failed to download the booking PDF. Please try again.');
      },
    });
  }

  private loadUser(): void {
    const rawUser = localStorage.getItem('user');
    this.user = this.authService.currentUser;

    if (!this.user && rawUser) {
      try {
        this.user = JSON.parse(rawUser);
      } catch {
        this.user = null;
      }
    }

    this.menuItems = this.menuService.getVisibleMenuItemsForContext('operator');
  }
}
