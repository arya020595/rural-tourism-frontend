import { Component, Input } from '@angular/core';
import { DashboardSummary } from '../../dashboard.models';

@Component({
  selector: 'app-dashboard-summary-cards',
  templateUrl: './dashboard-summary-cards.component.html',
  styleUrls: ['./dashboard-summary-cards.component.scss'],
})
export class DashboardSummaryCardsComponent {
  @Input() summary: DashboardSummary | null = null;

  formatCompact(value: number, withCurrency = false): string {
    const prefix = withCurrency ? 'RM ' : '';
    const absValue = Math.abs(value);
    let displayValue = value;
    let suffix = '';

    if (absValue >= 1_000_000_000_000) {
      displayValue = value / 1_000_000_000_000;
      suffix = ' T';
    } else if (absValue >= 1_000_000_000) {
      displayValue = value / 1_000_000_000;
      suffix = ' B';
    } else if (absValue >= 10_000_000) {
      // 10M and above → compact (e.g. RM 20.5 M)
      displayValue = value / 1_000_000;
      suffix = ' M';
    }

    // Currency always shows 2 decimals (RM 40,574.50), counts none.
    const fractionDigits = suffix || withCurrency ? 2 : 0;
    const formatted = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: withCurrency && !suffix ? 2 : 0,
      maximumFractionDigits: fractionDigits,
    }).format(displayValue);

    return `${prefix}${formatted}${suffix}`;
  }
}
