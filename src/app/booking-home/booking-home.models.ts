export interface BookingRow {
  id?: string;
  bookedDate: string; // YYYY-MM-DD
  serviceName: string;
  type: 'Activity' | 'Accommodation' | 'Package';
  status:
    | 'paid'
    | 'booked'
    | 'pending'
    | 'cancelled'
    | 'confirmed'
    | 'completed'
    | 'rejected';
}

export interface BookingDetail extends BookingRow {
  // Database numeric ID used for API calls (e.g. /api/bookings/:numericId/pdf)
  numericId?: number;

  // What to show as "the booking number" in headings/labels: the original
  // PE####### receipt number for a migrated booking, or the internal id
  // for a native one. Never used for routing/API calls — id/numericId stay
  // the real identifiers. See docs/LEGACY_DB_MIGRATION_ANALYSIS.md §8.9.
  displayId?: string;

  // True when this booking came from the old Kiulu system migration
  // (bookings.legacy_receipt_id is set). Migrated bookings are read-only
  // historical records — no cancel/edit/recall/receipt actions, since
  // there is no live product/payment flow behind them to act on.
  isLegacy?: boolean;

  // Common fields
  time?: string; // HH:MM format for activities
  fullName?: string;
  phone?: string;
  email?: string;
  nationality?: 'domestic' | 'international' | 'both';
  domesticPax?: number;
  internationalPax?: number;
  totalAmount?: number;
  totalDeposit?: number;
  operatorName?: string;

  // Activity specific
  activityName?: string;

  // Accommodation specific
  checkInDate?: string; // YYYY-MM-DD
  checkOutDate?: string; // YYYY-MM-DD
  nights?: number;
  homestay?: string;

  // Package specific
  packageName?: string;
  packagePrice?: number;
  customerType?: 'tourist' | 'company';
  package_companies?: any[];

  // Offline sync fields
  version?: number;

  // UI fields
  createdAt?: string;
  updatedAt?: string;
}
