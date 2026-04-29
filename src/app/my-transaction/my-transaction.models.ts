export type TransactionTab = 'activity' | 'accommodation' | 'package';

export interface MockTransaction {
  id: string;
  title: string;
  name: string;
  date: string;
  time: string;
  pax: number;
  totalPrice: number;
  status: 'Paid' | 'Void' | 'Booked';
}
