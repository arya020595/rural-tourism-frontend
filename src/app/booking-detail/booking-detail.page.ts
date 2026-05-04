import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MenuController } from '@ionic/angular';
import { AuthService } from '../services/auth.service';
import { MenuItem, MenuService } from '../services/menu.service';
import { BookingDetail } from '../booking-home/booking-home.models';
import { LoadingService } from '../services/loading.service';

@Component({
  selector: 'app-booking-detail',
  templateUrl: './booking-detail.page.html',
  styleUrls: ['./booking-detail.page.scss'],
})
export class BookingDetailPage implements OnInit {
  user: any = null;
  menuItems: MenuItem[] = [];
  booking: BookingDetail | null = null;
  isGeneratingPdf = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private menuCtrl: MenuController,
    private menuService: MenuService,
    private authService: AuthService,
    private loadingService: LoadingService,
  ) {
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras?.state?.['booking']) {
      this.booking = navigation.extras.state['booking'];
    }
  }

  ngOnInit(): void {
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

  async viewPaymentReceipt(): Promise<void> {
    if (this.isGeneratingPdf) {
      return;
    }
    this.isGeneratingPdf = true;
    await this.loadingService.show('Menjana PDF / Generating PDF...');
    try {
      // TODO: Generate and display PDF
      console.log('Generating payment receipt for:', this.booking?.id);
      // Simulate async PDF generation until real implementation is added
      await new Promise<void>((resolve) => setTimeout(resolve, 2000));
    } finally {
      await this.loadingService.hide();
      this.isGeneratingPdf = false;
    }
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
