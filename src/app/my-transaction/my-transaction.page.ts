import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MenuController } from '@ionic/angular';
import { AuthService } from '../services/auth.service';
import { MenuItem, MenuService } from '../services/menu.service';
import { MockTransaction, TransactionTab } from './my-transaction.models';

@Component({
  selector: 'app-my-transaction',
  templateUrl: './my-transaction.page.html',
  styleUrls: ['./my-transaction.page.scss'],
})
export class MyTransactionPage implements OnInit {
  user: any = null;
  menuItems: MenuItem[] = [];

  selectedTab: TransactionTab = 'activity';
  selectedDateIso: string = this.toIsoDate(new Date());
  isDateModalOpen = false;

  readonly defaultFetchSize = 3;
  readonly apiPathByTab: Record<TransactionTab, string> = {
    activity: '/operator/transactions/activity',
    accommodation: '/operator/transactions/accommodation',
    package: '/operator/transactions/package',
  };

  private readonly mockTransactionsByTab: Record<TransactionTab, MockTransaction[]> = {
    activity: [
      {
        id: 'ACT-001',
        title: 'Mount Kinabalu Climbing',
        name: 'Muhammad Amiirul Hamizan Bin Haji Alimarjafri',
        date: 'Jan 27, 2026',
        time: '07:00 - 08:00',
        pax: 1,
        totalPrice: 40,
        status: 'Paid',
      },
      {
        id: 'ACT-002',
        title: 'Kiulu River Tubing',
        name: 'Siti Nur Aina',
        date: 'Jan 28, 2026',
        time: '09:00 - 10:00',
        pax: 2,
        totalPrice: 80,
        status: 'Booked',
      },
      {
        id: 'ACT-003',
        title: 'Jungle Trekking Experience',
        name: 'Aiman Hakim',
        date: 'Jan 30, 2026',
        time: '08:30 - 11:30',
        pax: 4,
        totalPrice: 220,
        status: 'Paid',
      },
    ],
    accommodation: [
      {
        id: 'ACC-001',
        title: 'Kiulu Water Rafting Stay',
        name: 'Hanani Rasyiqah',
        date: 'Jan 27, 2026',
        time: '10:00 - 11:00',
        pax: 5,
        totalPrice: 120,
        status: 'Paid',
      },
      {
        id: 'ACC-002',
        title: 'Ranau Highland Homestay',
        name: 'Ahmad Fakhrul',
        date: 'Jan 28, 2026',
        time: '14:00 - 15:00',
        pax: 3,
        totalPrice: 150,
        status: 'Booked',
      },
      {
        id: 'ACC-003',
        title: 'Kiulu Farmstay Chalet',
        name: 'Nur Atikah',
        date: 'Jan 29, 2026',
        time: '13:00 - 14:00',
        pax: 2,
        totalPrice: 95,
        status: 'Paid',
      },
    ],
    package: [
      {
        id: 'PKG-001',
        title: 'Firefly Watching',
        name: 'Azri Nizam',
        date: 'Jan 29, 2026',
        time: '12:00 - 13:00',
        pax: 5,
        totalPrice: 120,
        status: 'Void',
      },
      {
        id: 'PKG-002',
        title: 'Kiulu Water Rafting & Hiking',
        name: 'Rina Mardhiah',
        date: 'Jan 30, 2026',
        time: '10:00 - 16:00',
        pax: 4,
        totalPrice: 320,
        status: 'Paid',
      },
      {
        id: 'PKG-003',
        title: 'Cultural Village + ATV Adventure',
        name: 'Syafiq Adli',
        date: 'Jan 31, 2026',
        time: '08:00 - 17:00',
        pax: 6,
        totalPrice: 560,
        status: 'Booked',
      },
    ],
  };

  constructor(
    private menuCtrl: MenuController,
    private menuService: MenuService,
    private authService: AuthService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.loadUser();
  }

  ionViewWillEnter(): void {
    this.menuCtrl.enable(true, 'my-transaction-menu');
    this.loadUser();
  }

  onMenuItemTap(_item: MenuItem): void {
    this.menuCtrl.close('my-transaction-menu');
  }

  logOut(): void {
    this.authService.logout('/login');
    this.user = null;
    this.menuCtrl.enable(false, 'my-transaction-menu');
    this.menuCtrl.close('my-transaction-menu');
  }

  selectTab(tab: TransactionTab): void {
    this.selectedTab = tab;
    // TODO: replace with API call per tab using this.apiPathByTab[tab]
    // this.fetchTransactionsByTab(tab, 1, this.defaultFetchSize);
  }

  openDatePicker(): void {
    this.isDateModalOpen = true;
  }

  closeDatePicker(): void {
    this.isDateModalOpen = false;
  }

  applyDateSelection(): void {
    this.isDateModalOpen = false;
    // TODO: fetch with selected date filter once API is wired.
    // this.fetchTransactionsByTab(this.selectedTab, 1, this.defaultFetchSize);
  }

  onResetDate(): void {
    this.selectedDateIso = this.toIsoDate(new Date());
    // TODO: fetch with today's date once API is wired.
    // this.fetchTransactionsByTab(this.selectedTab, 1, this.defaultFetchSize);
  }

  get selectedDateLabel(): string {
    if (this.selectedDateIso === this.toIsoDate(new Date())) {
      return 'Select Date';
    }

    return this.formatDateLabel(this.selectedDateIso);
  }

  get visibleTransactions(): MockTransaction[] {
    return this.mockTransactionsByTab[this.selectedTab].slice(0, this.defaultFetchSize);
  }

  get activeTabLabel(): string {
    switch (this.selectedTab) {
      case 'activity':
        return 'Activity';
      case 'accommodation':
        return 'Accommodation';
      default:
        return 'Package';
    }
  }


  viewReceipt(transaction: MockTransaction): void {
    this.router.navigate(['/my-transaction/receipt'], {
      state: {
        transaction,
        tab: this.selectedTab,
      },
    });
  }

  getStatusClass(status: MockTransaction['status']): string {
    switch (status) {
      case 'Paid':
        return 'paid';
      case 'Void':
        return 'void';
      default:
        return 'booked';
    }
  }

  private fetchTransactionsByTab(
    tab: TransactionTab,
    page: number,
    limit: number,
  ): void {
    // Placeholder for future API integration.
    // Expected request shape:
    // GET `${this.apiPathByTab[tab]}?page=${page}&limit=${limit}`
    void tab;
    void page;
    void limit;
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

  private formatDateLabel(isoDate: string): string {
    const parsed = new Date(isoDate);
    if (Number.isNaN(parsed.getTime())) {
      return isoDate;
    }

    return parsed.toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    });
  }

  private toIsoDate(date: Date): string {
    return date.toISOString().slice(0, 10);
  }
}
