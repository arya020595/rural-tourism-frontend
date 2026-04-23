export interface BookingRow {
  bookedDate: string; // YYYY-MM-DD
  serviceName: string;
  type: string;
  status: 'Paid' | 'Pending' | 'Booked';
}
