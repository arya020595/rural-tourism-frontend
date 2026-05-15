export type TransactionTab = 'activity' | 'accommodation' | 'package';

export interface PackageCompany {
  id: number;
  booking_package_id: number;
  referrer_id: number;
  referral_company: string;
  referee_id: number;
  referee_company: string;
  description: string;
  per_price: number;
}

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
  // Company A (booking creator) package view
  packageCompanies?: PackageCompany[];
  // Company B (referee) package view
  isReferral?: boolean;
  packageName?: string;
  referralBy?: string;
  perPrice?: number;
  _raw?: any;
}
