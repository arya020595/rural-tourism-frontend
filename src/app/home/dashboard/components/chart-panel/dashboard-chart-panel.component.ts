import { Component, Input, OnChanges } from '@angular/core';
import {
  ApexAxisChartSeries,
  ApexChart,
  ApexDataLabels,
  ApexGrid,
  ApexLegend,
  ApexMarkers,
  ApexPlotOptions,
  ApexStroke,
  ApexTitleSubtitle,
  ApexTooltip,
  ApexXAxis,
  ApexYAxis,
  ApexFill,
} from 'ng-apexcharts';

export type DashboardChartType = 'bar' | 'line';

export interface DashboardSeries {
  name: string;
  data: number[];
}

@Component({
  selector: 'app-dashboard-chart-panel',
  templateUrl: './dashboard-chart-panel.component.html',
  styleUrls: ['./dashboard-chart-panel.component.scss'],
})
export class DashboardChartPanelComponent implements OnChanges {
  @Input() title = '';
  @Input() categories: string[] = [];
  @Input() series: DashboardSeries[] = [];
  @Input() type: DashboardChartType = 'bar';
  @Input() height = 340;

  chartSeries: ApexAxisChartSeries = [];
  chartConfig: ApexChart = {
    type: 'bar',
    toolbar: { show: false },
    zoom: { enabled: false },
    selection: { enabled: false },
    height: 340,
  };
  colors: string[] = ['#04552f', '#ff9500', '#2c5b8e'];
  xaxis: ApexXAxis = { categories: [] };
  yaxis: ApexYAxis = { labels: { style: { colors: '#7d7d7d' } } };
  dataLabels: ApexDataLabels = { enabled: false };
  plotOptions: ApexPlotOptions = { bar: { borderRadius: 8, columnWidth: '48%' } };
  fill: ApexFill = { opacity: 1 };
  stroke: ApexStroke = { curve: 'smooth', width: 3 };
  markers: ApexMarkers = { size: 4 };
  grid: ApexGrid = { borderColor: '#e0e0e0', strokeDashArray: 3 };
  legend: ApexLegend = {
    position: 'bottom',
    horizontalAlign: 'center',
    labels: { colors: '#7a7a7a' },
  };
  tooltip: ApexTooltip = { theme: 'light' };
  titleConfig: ApexTitleSubtitle = {
    text: '',
    align: 'center',
    style: {
      fontSize: '22px',
      fontWeight: '700',
      color: '#7b7b7b',
    },
  };

  ngOnChanges(): void {
    this.chartSeries = this.series;
    const isTodaySingleBar = this.type === 'bar' && this.series.length === 1;

    this.chartConfig = {
      type: this.type,
      toolbar: { show: false },
      zoom: { enabled: false },
      selection: { enabled: false },
      height: this.height,
      animations: { enabled: true },
      foreColor: '#7b7b7b',
    };
    this.xaxis = {
      categories: this.categories,
      labels: { style: { colors: '#8a8a8a' } },
    };
    this.plotOptions = {
      bar: {
        borderRadius: 8,
        columnWidth: this.series.length > 1 ? '60%' : '48%',
        distributed: isTodaySingleBar,
      },
    };
    this.titleConfig = {
      ...this.titleConfig,
      text: this.title,
    };
  }
}
