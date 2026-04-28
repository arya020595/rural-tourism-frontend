import { Component, OnInit } from '@angular/core';
import { MenuController } from '@ionic/angular';
import { AuthService } from '../services/auth.service';
import { MenuItem, MenuService } from '../services/menu.service';
import { BookingRow } from './booking-home.models';

interface CalendarCell {
  key: string | null;
  dayNumber: number | null;
  inCurrentMonth: boolean;
  bookings: BookingRow[];
}

type BookingViewMode = 'table' | 'calendar';

@Component({
  selector: 'app-booking-home',
  templateUrl: './booking-home.page.html',
  styleUrls: ['./booking-home.page.scss'],
})
export class BookingHomePage implements OnInit {
  user: any = null;
  menuItems: MenuItem[] = [];

  viewMode: BookingViewMode = 'table';

  readonly dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  currentMonthDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  calendarCells: CalendarCell[] = [];
  selectedDateKey: string | null = null;

  readonly bookings: BookingRow[] = this.createMockBookings();

  constructor(
    private menuCtrl: MenuController,
    private menuService: MenuService,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.loadUser();
    this.buildCalendar();
  }

  ionViewWillEnter(): void {
    this.menuCtrl.enable(true, 'booking-menu');
    this.loadUser();
  }

  onMenuItemTap(_item: MenuItem): void {
    this.menuCtrl.close('booking-menu');
  }

  logOut(): void {
    this.authService.logout('/login');
    this.user = null;
    this.menuCtrl.enable(false, 'booking-menu');
    this.menuCtrl.close('booking-menu');
  }

  setView(mode: BookingViewMode): void {
    this.viewMode = mode;
  }

  goToPreviousMonth(): void {
    this.currentMonthDate = new Date(
      this.currentMonthDate.getFullYear(),
      this.currentMonthDate.getMonth() - 1,
      1,
    );

    this.buildCalendar();
  }

  goToNextMonth(): void {
    this.currentMonthDate = new Date(
      this.currentMonthDate.getFullYear(),
      this.currentMonthDate.getMonth() + 1,
      1,
    );

    this.buildCalendar();
  }

  selectDate(cell: CalendarCell): void {
    if (!cell.key) {
      return;
    }

    this.selectedDateKey = cell.key;
  }

  get currentMonthLabel(): string {
    return this.currentMonthDate.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  }

  get selectedDateLabel(): string {
    if (!this.selectedDateKey) {
      return this.currentMonthLabel;
    }

    const date = this.parseDateKey(this.selectedDateKey);

    return `${this.getOrdinal(date.getDate())} ${date.toLocaleDateString('en-US', {
      month: 'short',
    })}`;
  }

  get selectedDateBookings(): BookingRow[] {
    if (!this.selectedDateKey) {
      return [];
    }

    return this.bookings
      .filter((booking) => booking.bookedDate === this.selectedDateKey)
      .sort((a, b) => a.serviceName.localeCompare(b.serviceName));
  }

  trackByCell(index: number): number {
    return index;
  }

  isSelectedDay(cell: CalendarCell): boolean {
    return !!cell.key && cell.key === this.selectedDateKey;
  }

  hasBookings(cell: CalendarCell): boolean {
    return cell.bookings.length > 0;
  }

  getDayStatusClass(cell: CalendarCell): string {
    if (!cell.inCurrentMonth || !cell.key) {
      return '';
    }

    if (this.isSelectedDay(cell)) {
      return 'selected';
    }

    if (!cell.bookings.length) {
      return '';
    }

    return cell.bookings.some((booking) => booking.status === 'Paid')
      ? 'paid'
      : 'booked';
  }

  getBookingStatusClass(booking: BookingRow): string {
    return booking.status === 'Paid' ? 'paid' : 'booked';
  }

  getBookingStatusText(booking: BookingRow): string {
    return booking.status === 'Paid' ? 'Paid' : 'Booked';
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

  private buildCalendar(): void {
    const year = this.currentMonthDate.getFullYear();
    const month = this.currentMonthDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const bookingsByDate = new Map<string, BookingRow[]>();
    this.bookings.forEach((booking) => {
      const bookingDate = new Date(booking.bookedDate);
      if (
        bookingDate.getFullYear() === year &&
        bookingDate.getMonth() === month
      ) {
        const key = this.toDateKey(bookingDate);
        const current = bookingsByDate.get(key) || [];
        current.push(booking);
        bookingsByDate.set(key, current);
      }
    });

    const cells: CalendarCell[] = [];

    for (let i = 0; i < firstDayIndex; i += 1) {
      cells.push({
        key: null,
        dayNumber: null,
        inCurrentMonth: false,
        bookings: [],
      });
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = new Date(year, month, day);
      const key = this.toDateKey(date);

      cells.push({
        key,
        dayNumber: day,
        inCurrentMonth: true,
        bookings: bookingsByDate.get(key) || [],
      });
    }

    while (cells.length % 7 !== 0) {
      cells.push({
        key: null,
        dayNumber: null,
        inCurrentMonth: false,
        bookings: [],
      });
    }

    this.calendarCells = cells;

    const currentMonthKeys = new Set(
      cells.filter((cell) => !!cell.key).map((cell) => cell.key as string),
    );

    if (this.selectedDateKey && currentMonthKeys.has(this.selectedDateKey)) {
      return;
    }

    const firstBookedDate = cells.find(
      (cell) => !!cell.key && cell.bookings.length > 0,
    );

    this.selectedDateKey = firstBookedDate?.key || null;
  }

  private createMockBookings(): BookingRow[] {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    const currentMonthDate = (day: number): string =>
      this.toDateKey(new Date(year, month, day));

    const nextMonthDate = (day: number): string =>
      this.toDateKey(new Date(year, month + 1, day));

    return [
      {
        bookedDate: currentMonthDate(7),
        serviceName: 'Rafting (Kiulu) - Activity',
        type: 'Activity',
        status: 'Paid',
      },
      {
        bookedDate: currentMonthDate(7),
        serviceName: 'Kiulu Farmstay - Accommodation',
        type: 'Accommodation',
        status: 'Paid',
      },
      {
        bookedDate: currentMonthDate(7),
        serviceName: 'Kiulu Water Rafting - Activity',
        type: 'Activity',
        status: 'Booked',
      },
      {
        bookedDate: currentMonthDate(11),
        serviceName: 'Kiulu Water Rafting & Hiking - Package',
        type: 'Package',
        status: 'Booked',
      },
      {
        bookedDate: currentMonthDate(13),
        serviceName: 'Ranau Hotel Resorts',
        type: 'Accommodation',
        status: 'Paid',
      },
      {
        bookedDate: currentMonthDate(19),
        serviceName: 'Hiking, Kiulu Riverside Chalet',
        type: 'Package',
        status: 'Paid',
      },
      {
        bookedDate: nextMonthDate(3),
        serviceName: 'Kiulu Homestay',
        type: 'Accommodation',
        status: 'Booked',
      },
      {
        bookedDate: nextMonthDate(8),
        serviceName: 'Kiulu Water Rafting',
        type: 'Activity',
        status: 'Paid',
      },
    ];
  }

  private toDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  private parseDateKey(key: string): Date {
    const [year, month, day] = key.split('-').map(Number);
    return new Date(year, (month || 1) - 1, day || 1);
  }

  private getOrdinal(day: number): string {
    if (day > 3 && day < 21) return `${day}th`;

    switch (day % 10) {
      case 1:
        return `${day}st`;
      case 2:
        return `${day}nd`;
      case 3:
        return `${day}rd`;
      default:
        return `${day}th`;
    }
  }
}
