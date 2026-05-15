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

  // Common fields
  time?: string; // HH:MM format for activities
  fullName?: string;
  phone?: string;
  email?: string;
  nationality?: 'domestic' | 'international' | 'both';
  domesticPax?: number;
  internationalPax?: number;
  totalAmount?: number;
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
