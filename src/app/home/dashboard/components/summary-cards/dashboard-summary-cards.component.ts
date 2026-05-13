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
    const absValue = Math.abs(value);
    let displayValue = value;
    let suffix = '';

    if (absValue >= 1_000_000_000_000) {
      displayValue = value / 1_000_000_000_000;
      suffix = ' T';
    } else if (absValue >= 1_000_000_000) {
      displayValue = value / 1_000_000_000;
      suffix = ' B';
    } else if (absValue >= 100_000) {
      displayValue = value / 1_000_000;
      suffix = ' M';
    }

    const formatted = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: suffix ? 3 : withCurrency ? 2 : 0,
    }).format(displayValue);

    return `${withCurrency ? 'RM ' : ''}${formatted}${suffix}`;
  }
}
