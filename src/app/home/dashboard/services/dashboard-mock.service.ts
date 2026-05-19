import { Injectable } from '@angular/core';
import {
  TodayDashboardData,
  TrendDashboardData,
  TrendChartItem,
} from '../dashboard.models';

@Injectable({ providedIn: 'root' })
export class DashboardMockService {
  getTodayDashboardData(): TodayDashboardData {
    return {
      asOfDate: '2026-05-13',
      summary: {
        totalRevenue: 450.5,
        totalReceipts: 67,
        totalTourists: 2034,
      },
      charts: {
        revenue: {
          activity: 25,
          accommodation: 135,
          package: 67,
        },
        receipts: {
          activity: 75,
          accommodation: 73,
          package: 124,
        },
        tourists: {
          activity: 135,
          accommodation: 124,
          package: 45,
        },
      },
    };
  }

  getTrendDashboardData(from?: string, to?: string): TrendDashboardData {
    const revenueTrend = this.getRevenueTrend();
    const receiptsTrend = this.getReceiptsTrend();
    const touristsTrend = this.getTouristsTrend();

    const filteredRevenueTrend = this.filterByMonthRange(revenueTrend, from, to);
    const filteredReceiptsTrend = this.filterByMonthRange(receiptsTrend, from, to);
    const filteredTouristsTrend = this.filterByMonthRange(touristsTrend, from, to);

    return {
      range: {
        from: from || '2026-01',
        to: to || '2026-05',
        start: '2026-01-01T00:00:00.000Z',
        end: '2026-05-31T23:59:59.999Z',
      },
      summary: {
        totalRevenue: 22350.5,
        totalReceipts: 1203,
        totalTourists: 5034,
      },
      revenueTrend: filteredRevenueTrend,
      receiptsTrend: filteredReceiptsTrend,
      touristsTrend: filteredTouristsTrend,
    };
  }

  private getRevenueTrend(): TrendChartItem[] {
    return [
      { month: 'Jan', activity: 50, accommodation: 120, package: 20 },
      { month: 'Feb', activity: 100, accommodation: 0, package: 300 },
      { month: 'Mar', activity: 150, accommodation: 100, package: 200 },
      { month: 'Apr', activity: 200, accommodation: 320, package: 30 },
      { month: 'May', activity: 100, accommodation: 55, package: 190 },
    ];
  }

  private getReceiptsTrend(): TrendChartItem[] {
    return [
      { month: 'Jan', activity: 75, accommodation: 80, package: 150 },
      { month: 'Feb', activity: 150, accommodation: 100, package: 125 },
      { month: 'Mar', activity: 150, accommodation: 120, package: 60 },
      { month: 'Apr', activity: 133, accommodation: 100, package: 102 },
      { month: 'May', activity: 88, accommodation: 150, package: 102 },
    ];
  }

  private getTouristsTrend(): TrendChartItem[] {
    return [
      { month: 'Jan', activity: 45, accommodation: 0, package: 100 },
      { month: 'Feb', activity: 155, accommodation: 100, package: 45 },
      { month: 'Mar', activity: 25, accommodation: 240, package: 160 },
      { month: 'Apr', activity: 255, accommodation: 200, package: 160 },
      { month: 'May', activity: 300, accommodation: 300, package: 250 },
    ];
  }

  private filterByMonthRange(
    trend: TrendChartItem[],
    from?: string,
    to?: string,
  ): TrendChartItem[] {
    if (!from && !to) {
      return trend;
    }

    const monthMap: Record<string, number> = {
      Jan: 1,
      Feb: 2,
      Mar: 3,
      Apr: 4,
      May: 5,
      Jun: 6,
      Jul: 7,
      Aug: 8,
      Sep: 9,
      Oct: 10,
      Nov: 11,
      Dec: 12,
    };

    const fromMonth = from ? Number(from.split('-')[1]) : 1;
    const toMonth = to ? Number(to.split('-')[1]) : 12;

    return trend.filter((item) => {
      const current = monthMap[item.month] || 0;
      return current >= fromMonth && current <= toMonth;
    });
  }
}
