export type BookingTypeKey = 'activity' | 'accommodation' | 'package';

export interface DashboardSummary {
  totalRevenue: number;
  totalReceipts: number;
  totalTourists: number;
}

export interface TodayChartMetrics {
  revenue: Record<BookingTypeKey, number>;
  receipts: Record<BookingTypeKey, number>;
  tourists: Record<BookingTypeKey, number>;
}

export interface TrendChartItem {
  month: string;
  activity: number;
  accommodation: number;
  package: number;
}

export interface ReceiptListItem {
  receiptId: string;
  bookedBy: string;
  serviceName: string;
  type: 'Activity' | 'Accommodation' | 'Package';
  createdAt: string;
}

export interface TodayDashboardData {
  asOfDate: string;
  summary: DashboardSummary;
  charts: TodayChartMetrics;
}

export interface TrendRange {
  from: string;
  to: string;
  start: string;
  end: string;
}

export interface TrendDashboardData {
  range: TrendRange;
  summary: DashboardSummary;
  revenueTrend: TrendChartItem[];
  receiptsTrend: TrendChartItem[];
  touristsTrend: TrendChartItem[];
}
