export interface BookingRow {
  id?: string;
  bookedDate: string; // YYYY-MM-DD
  serviceName: string;
  type: 'Activity' | 'Accommodation' | 'Package';
  status: 'Paid' | 'Pending' | 'Booked';
}

export interface BookingDetail extends BookingRow {
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

  // UI fields
  createdAt?: string;
  updatedAt?: string;
}
