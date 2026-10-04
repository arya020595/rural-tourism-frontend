import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { BookingService } from '../../../services/booking.service';

interface CalendarCell {
  iso: string;
  day: number;
  inMonth: boolean;
}

const MONTH_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

/** YYYY-MM-DD for a local calendar date (no UTC shift). */
function toIso(year: number, monthIndex: number, day: number): string {
  return `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/** YYYY-MM-DD → dd/mm/yyyy for the read-only date fields; '' if empty/invalid. */
export function toDisplayDate(iso: string | null | undefined): string {
  const match = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : '';
}

/**
 * App-drawn date picker shown as a centred pop-up. Replaces the native
 * <input type="date"> dialog, which Android draws itself and which gets cut
 * off on some tablets in landscape. Dates that already have a booking for the
 * operator's company are marked with a dot.
 */
@Component({
  selector: 'app-booking-date-sheet',
  templateUrl: './booking-date-sheet.component.html',
  styleUrls: ['./booking-date-sheet.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule],
})
export class BookingDateSheetComponent {
  @Input() isOpen = false;
  /** 'date' picks a day (YYYY-MM-DD); 'month' picks a month (YYYY-MM). */
  @Input() pickMode: 'date' | 'month' = 'date';
  /** Currently selected value: YYYY-MM-DD in date mode, YYYY-MM in month mode. */
  @Input() value = '';
  /** Earliest selectable date, YYYY-MM-DD (e.g. check-out ≥ check-in + 1). */
  @Input() min = '';
  /** Latest selectable date, YYYY-MM-DD. */
  @Input() max = '';
  @Input() title = 'Tarikh/Date';
  /** Mark dates that have bookings (booking forms). Off = plain calendar. */
  @Input() showBookedDates = true;
  @Output() dateSelected = new EventEmitter<string>();
  @Output() monthSelected = new EventEmitter<string>();
  @Output() dismissed = new EventEmitter<void>();

  readonly monthShort = MONTH_SHORT;
  readonly weekdays = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

  mode: 'day' | 'month' | 'year' = 'day';
  viewYear = new Date().getFullYear();
  viewMonth = new Date().getMonth();
  cells: CalendarCell[] = [];
  years: number[] = [];
  todayIso = '';

  private bookedDates = new Set<string>();
  private fetchedMonths = new Set<string>();

  constructor(
    private bookingService: BookingService,
    private host: ElementRef<HTMLElement>,
  ) {}

  /** Reset the view to the selected date (or today) each time the sheet opens. */
  onWillPresent(): void {
    const now = new Date();
    this.todayIso = toIso(now.getFullYear(), now.getMonth(), now.getDate());

    const match = String(this.value || '').match(/^(\d{4})-(\d{2})/);
    this.viewYear = match ? Number(match[1]) : now.getFullYear();
    this.viewMonth = match ? Number(match[2]) - 1 : now.getMonth();

    if (this.pickMode === 'month') {
      this.mode = 'month';
      return;
    }
    this.mode = 'day';
    this.buildGrid();
  }

  shiftMonth(delta: number): void {
    const date = new Date(this.viewYear, this.viewMonth + delta, 1);
    this.viewYear = date.getFullYear();
    this.viewMonth = date.getMonth();
    this.buildGrid();
  }

  shiftYear(delta: number): void {
    this.viewYear += delta;
  }

  openMonthMode(): void {
    this.mode = 'month';
  }

  openYearMode(): void {
    const current = new Date().getFullYear();
    const minYear = this.min ? Number(this.min.slice(0, 4)) : null;
    const maxYear = this.max ? Number(this.max.slice(0, 4)) : null;
    const from = minYear ?? Math.min(current - 10, this.viewYear);
    const to = maxYear ?? Math.max(current + 10, this.viewYear);
    this.years = Array.from({ length: to - from + 1 }, (_, i) => from + i);
    this.mode = 'year';
    // Bring the active year into view inside the scrollable year grid.
    setTimeout(() => {
      this.host.nativeElement.ownerDocument
        .querySelector('.date-sheet .cal-year.active')
        ?.scrollIntoView({ block: 'center' });
    });
  }

  pickMonth(monthIndex: number): void {
    if (this.isMonthDisabled(monthIndex)) return;

    if (this.pickMode === 'month') {
      this.monthSelected.emit(this.monthKey(this.viewYear, monthIndex));
      return;
    }
    this.viewMonth = monthIndex;
    this.mode = 'day';
    this.buildGrid();
  }

  pickYear(year: number): void {
    this.viewYear = year;
    this.mode = 'month';
  }

  /** Calendar icon in the month/year views: back to the main view. */
  backToMain(): void {
    if (this.pickMode === 'month') {
      this.mode = 'month';
      return;
    }
    this.mode = 'day';
    this.buildGrid();
  }

  pickDay(cell: CalendarCell): void {
    if (this.isDisabled(cell.iso)) return;
    this.dateSelected.emit(cell.iso);
  }

  isBooked(iso: string): boolean {
    return this.showBookedDates && this.bookedDates.has(iso);
  }

  isDisabled(iso: string): boolean {
    return (!!this.min && iso < this.min) || (!!this.max && iso > this.max);
  }

  /** Disabled when the whole month falls outside [min, max]. */
  isMonthDisabled(monthIndex: number): boolean {
    const key = this.monthKey(this.viewYear, monthIndex);
    return (
      (!!this.min && key < this.min.slice(0, 7)) ||
      (!!this.max && key > this.max.slice(0, 7))
    );
  }

  /** Date mode highlights the month being viewed; month mode the chosen one. */
  isMonthActive(monthIndex: number): boolean {
    if (this.pickMode === 'month') {
      return this.monthKey(this.viewYear, monthIndex) === String(this.value || '').slice(0, 7);
    }
    return monthIndex === this.viewMonth;
  }

  canShiftYear(delta: number): boolean {
    const year = this.viewYear + delta;
    if (this.min && year < Number(this.min.slice(0, 4))) return false;
    if (this.max && year > Number(this.max.slice(0, 4))) return false;
    return true;
  }

  private monthKey(year: number, monthIndex: number): string {
    return `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
  }

  private buildGrid(): void {
    const first = new Date(this.viewYear, this.viewMonth, 1);
    // Monday-first: how many leading days from the previous month.
    const leading = (first.getDay() + 6) % 7;
    const start = new Date(this.viewYear, this.viewMonth, 1 - leading);

    this.cells = Array.from({ length: 42 }, (_, i) => {
      const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
      return {
        iso: toIso(date.getFullYear(), date.getMonth(), date.getDate()),
        day: date.getDate(),
        inMonth: date.getMonth() === this.viewMonth,
      };
    });

    this.loadBookedDates();
  }

  private loadBookedDates(): void {
    if (!this.showBookedDates) return;
    const key = `${this.viewYear}-${this.viewMonth}`;
    if (this.fetchedMonths.has(key)) return;
    this.fetchedMonths.add(key);

    const from = this.cells[0].iso;
    const to = this.cells[this.cells.length - 1].iso;

    this.bookingService.getBookedDates(from, to).subscribe({
      next: (response: any) => {
        const dates: string[] = response?.data?.dates ?? [];
        dates.forEach((date) => this.bookedDates.add(date));
      },
      // Dots are a hint only — if this fails (e.g. offline) the calendar
      // still works; allow a retry next time this month is shown.
      error: () => this.fetchedMonths.delete(key),
    });
  }
}
