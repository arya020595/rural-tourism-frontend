export type TransactionTab = 'activity' | 'accommodation' | 'package';

export interface Transaction {
  id: string | number;
  title: string;
  name: string;
  date: string;
  time?: string;
  pax: number;
  totalPrice: number;
  status: string;
  bookingType: TransactionTab;
  numericId?: number;
  checkInDate?: string;
  checkOutDate?: string;
  _raw?: any; // original API response for receipt navigation
}
