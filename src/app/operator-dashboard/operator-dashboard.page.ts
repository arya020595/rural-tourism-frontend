import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, MenuController } from '@ionic/angular';
import { NotificationService } from '../services/notification.service';

declare global {
  interface Window {
    Chart: any;
  }
}

@Component({
  selector: 'app-operator-dashboard',
  templateUrl: 'operator-dashboard.page.html',
  styleUrls: ['operator-dashboard.page.scss'],
})
export class OperatorDashboardPage implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('revenueCanvas', { static: false }) revenueCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('receiptCanvas', { static: false }) receiptCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('touristCanvas', { static: false }) touristCanvas?: ElementRef<HTMLCanvasElement>;

  uid: string | null = null;
  user: any = null;
  unreadCount = 0;

  fromDate = '';
  toDate = '';

  private revenueChart: any;
  private receiptChart: any;
  private touristChart: any;
  private static chartJsLoader?: Promise<void>;

  constructor(
    private menuCtrl: MenuController,
    private router: Router,
    private notificationService: NotificationService,
    private alertController: AlertController,
  ) {}

  ngOnInit(): void {
    this.uid = localStorage.getItem('uid');
    const storedUser = localStorage.getItem('user');
    this.user = storedUser ? JSON.parse(storedUser) : null;

    this.notificationService.unreadCount$.subscribe((count) => {
      this.unreadCount = count;
    });
  }

  ionViewWillEnter(): void {
    this.menuCtrl.enable(true, 'operator-menu');
    this.menuCtrl.swipeGesture(true, 'operator-menu');
  }

  async ngAfterViewInit(): Promise<void> {
    try {
      await this.loadChartJs();
      this.renderCharts();
    } catch (err) {
      console.error(err);
    }
  }

  ngOnDestroy(): void {
    this.destroyCharts();
  }

  closeMenu(): void {
    this.menuCtrl.close();
  }

  goToNotifications(): void {
    if (!this.uid) return;
    this.router.navigate(['/notifications']);
  }

  async onFilter(): Promise<void> {
    if (!this.fromDate || !this.toDate) {
      const alert = await this.alertController.create({
        header: 'Invalid Date',
        message: 'Please select both From and To dates.',
        buttons: ['OK'],
      });
      await alert.present();
      return;
    }

    if (this.fromDate >= this.toDate) {
      const alert = await this.alertController.create({
        header: 'Invalid Date Range',
        message: 'From date must be earlier than To date.',
        buttons: ['OK'],
      });
      await alert.present();
      return;
    }

    console.log('Filter dates:', {
      from: this.fromDate,
      to: this.toDate,
    });
  }

  onReset(): void {
    this.fromDate = '';
    this.toDate = '';
    console.log('Reset dates:', {
      from: this.fromDate,
      to: this.toDate,
    });
  }

  private destroyCharts(): void {
    this.revenueChart?.destroy();
    this.receiptChart?.destroy();
    this.touristChart?.destroy();
  }

  private renderCharts(): void {
    this.destroyCharts();

    const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May'];

    this.revenueChart = new window.Chart(this.revenueCanvas?.nativeElement, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Total Revenue RM',
            data: [50, 110, 170, 220, 280],
            borderColor: '#1f7a44',
            backgroundColor: 'rgba(31, 122, 68, 0.15)',
            fill: true,
            tension: 0.3,
            borderWidth: 2,
            pointRadius: 4,
          },
        ],
      },
      options: this.getAxisOptions(),
    });

    this.receiptChart = new window.Chart(this.receiptCanvas?.nativeElement, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Total No. of Receipts',
            data: [40, 90, 120, 200, 260],
            backgroundColor: '#2e8b57',
            borderRadius: 8,
          },
        ],
      },
      options: this.getAxisOptions(),
    });

    this.touristChart = new window.Chart(this.touristCanvas?.nativeElement, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Total No. of Tourists',
            data: [30, 70, 120, 180, 240],
            borderColor: '#0f5e9c',
            backgroundColor: 'rgba(15, 94, 156, 0.15)',
            fill: true,
            tension: 0.3,
            borderWidth: 2,
            pointRadius: 4,
          },
        ],
      },
      options: this.getAxisOptions(),
    });
  }

  private getAxisOptions(): any {
    return {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          min: 0,
          max: 300,
          ticks: {
            stepSize: 50,
          },
        },
      },
      plugins: {
        legend: {
          display: false,
        },
      },
    };
  }

  private loadChartJs(): Promise<void> {
    if (window.Chart) {
      return Promise.resolve();
    }

    if (!OperatorDashboardPage.chartJsLoader) {
      OperatorDashboardPage.chartJsLoader = new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.3/dist/chart.umd.min.js';
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load Chart.js from CDN'));
        document.body.appendChild(script);
      });
    }

    return OperatorDashboardPage.chartJsLoader;
  }
}
