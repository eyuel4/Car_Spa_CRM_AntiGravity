import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DashboardService } from '../../../core/services/dashboard.service';
import { DashboardStats, KPIData, RecentService, ServiceWeekData, TopServiceData } from '../../../core/models/dashboard.model';

// Chart.js will be loaded as a global script via angular.json
// We'll access it from window object at runtime

interface KPI {
  label: string;
  value: string;
  change: string;
  icon: string;
  key: string;
}

@Component({
  selector: 'app-dashboard-overview',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './dashboard-overview.component.html',
  styleUrl: './dashboard-overview.component.css'
})
export class DashboardOverviewComponent implements OnInit, OnDestroy, AfterViewInit {
  kpis: KPI[] = [];
  recentServices: RecentService[] = [];

  // State management
  lastUpdate: Date | null = null;
  isRefreshing = false;
  selectedTimePeriod: 'today' | 'this_week' | 'this_month' | 'custom' = 'today';
  customDateRange: { from: Date | null, to: Date | null } = { from: null, to: null };
  showCustomDatePicker = false;

  // Auto-refresh interval
  private refreshInterval: any = null;
  private langChangeSubscription: any = null;

  // Chart references
  @ViewChild('servicesWeekChart', { static: false }) servicesWeekChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('topServicesChart', { static: false }) topServicesChartRef!: ElementRef<HTMLCanvasElement>;
  private servicesWeekChart: any = null;
  private topServicesChart: any = null;

  constructor(
    private dashboardService: DashboardService,
    private translate: TranslateService
  ) {
    // Initialize KPI structure
    this.kpis = [
      {
        label: '',
        value: '$0',
        change: '',
        icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
        key: 'revenue'
      },
      {
        label: '',
        value: '0',
        change: '',
        icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
        key: 'services'
      },
      {
        label: '',
        value: '0',
        change: '',
        icon: 'M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2',
        key: 'cars_in_queue'
      },
      {
        label: '',
        value: '0',
        change: '',
        icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
        key: 'new_customers'
      }
    ];
    this.updateKPILabels();
  }

  ngOnInit(): void {
    // Chart.js is loaded as a global script via angular.json
    // Access it from window object
    const ChartLib = (typeof window !== 'undefined' && (window as any).Chart) ? (window as any).Chart : null;
    if (ChartLib && ChartLib.register) {
      // Chart.js v4 registers components automatically when loaded as UMD
      // But we can explicitly register if needed
      try {
        if (ChartLib.registerables) {
          ChartLib.register(...ChartLib.registerables);
        }
      } catch (e) {
        // Chart.js might already be registered
        console.log('Chart.js registration:', e);
      }
    }

    // Subscribe to language changes to update KPI labels
    this.langChangeSubscription = this.translate.onLangChange.subscribe(() => {
      this.updateKPILabels();
    });

    this.loadDashboardData();
    // Set up auto-refresh every 30 minutes (only for 'today' period)
    this.setupAutoRefresh();
  }

  ngAfterViewInit(): void {
    // Charts will be initialized after data loads
  }

  ngOnDestroy(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
    if (this.langChangeSubscription) {
      this.langChangeSubscription.unsubscribe();
    }
    if (this.servicesWeekChart) {
      this.servicesWeekChart.destroy();
    }
    if (this.topServicesChart) {
      this.topServicesChart.destroy();
    }
  }

  setupAutoRefresh(): void {
    // Clear existing interval
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }

    // Only auto-refresh when period is 'today'
    if (this.selectedTimePeriod === 'today') {
      this.refreshInterval = setInterval(() => {
        this.loadDashboardData();
      }, 30 * 60 * 1000); // 30 minutes
    }
  }

  loadDashboardData(): void {
    this.isRefreshing = true;

    let dateFrom: string | undefined;
    let dateTo: string | undefined;

    if (this.selectedTimePeriod === 'custom' && this.customDateRange.from && this.customDateRange.to) {
      dateFrom = this.customDateRange.from.toISOString();
      dateTo = this.customDateRange.to.toISOString();
    }

    this.dashboardService.getDashboardStats(
      this.selectedTimePeriod,
      dateFrom,
      dateTo
    ).subscribe({
      next: (data: DashboardStats) => {
        this.updateKPIs(data.kpis);
        // Use setTimeout to ensure view is ready for chart initialization
        setTimeout(() => {
          this.updateCharts(data.charts);
        }, 0);
        this.recentServices = data.recent_services;
        this.lastUpdate = new Date();
        this.isRefreshing = false;
      },
      error: (error) => {
        console.error('Error loading dashboard data:', error);
        this.isRefreshing = false;
      }
    });
  }

  updateKPIs(kpiData: KPIData): void {
    // Update revenue
    const revenueKPI = this.kpis.find(k => k.key === 'revenue');
    if (revenueKPI) {
      revenueKPI.value = `$${parseFloat(kpiData.revenue).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      revenueKPI.label = this.getKPILabel('revenue');
    }

    // Update services
    const servicesKPI = this.kpis.find(k => k.key === 'services');
    if (servicesKPI) {
      servicesKPI.value = kpiData.services.toString();
      servicesKPI.label = this.getKPILabel('services');
    }

    // Update cars in queue
    const carsKPI = this.kpis.find(k => k.key === 'cars_in_queue');
    if (carsKPI) {
      carsKPI.value = kpiData.cars_in_queue.toString();
      carsKPI.change = this.translate.instant('DASHBOARD.KPIS.CURRENT');
      carsKPI.label = this.translate.instant('DASHBOARD.KPIS.CARS_IN_QUEUE');
    }

    // Update new customers
    const customersKPI = this.kpis.find(k => k.key === 'new_customers');
    if (customersKPI) {
      customersKPI.value = kpiData.new_customers.toString();
      customersKPI.label = this.getKPILabel('new_customers');
    }
  }

  updateCharts(chartData: any): void {
    // Update Services This Week chart
    const weekData = chartData.services_this_week || [];
    const weekLabels = weekData.map((item: ServiceWeekData) => {
      if (!item.date) return '';
      const date = new Date(item.date);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });
    const weekCounts = weekData.map((item: ServiceWeekData) => item.count);

    if (this.servicesWeekChart) {
      this.servicesWeekChart.destroy();
    }

    const ChartLib = (typeof window !== 'undefined' && (window as any).Chart) ? (window as any).Chart : null;
    if (!ChartLib) {
      console.error('Chart.js is not loaded');
      return;
    }

    if (this.servicesWeekChartRef?.nativeElement) {
      this.servicesWeekChart = new ChartLib(this.servicesWeekChartRef.nativeElement, {
        type: 'line',
        data: {
          labels: weekLabels,
          datasets: [{
            label: 'Services',
            data: weekCounts,
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.4,
            fill: true
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                stepSize: 1
              }
            }
          }
        }
      });
    }

    // Update Top Services chart
    const topServices = chartData.top_services || [];
    const serviceNames = topServices.map((item: TopServiceData) => item.service_name);
    const serviceCounts = topServices.map((item: TopServiceData) => item.count);

    if (this.topServicesChart) {
      this.topServicesChart.destroy();
    }

    if (!ChartLib) {
      console.error('Chart.js is not loaded');
      return;
    }

    if (this.topServicesChartRef?.nativeElement) {
      this.topServicesChart = new ChartLib(this.topServicesChartRef.nativeElement, {
        type: 'bar',
        data: {
          labels: serviceNames,
          datasets: [{
            label: 'Count',
            data: serviceCounts,
            backgroundColor: 'rgba(59, 130, 246, 0.8)',
            borderColor: 'rgb(59, 130, 246)',
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          indexAxis: 'y',
          plugins: {
            legend: {
              display: false
            }
          },
          scales: {
            x: {
              beginAtZero: true,
              ticks: {
                stepSize: 1
              }
            }
          }
        }
      });
    }
  }

  refreshAll(): void {
    this.loadDashboardData();
  }

  refreshRecentServices(): void {
    this.isRefreshing = true;
    this.loadDashboardData();
  }

  onTimePeriodChange(period: string): void {
    this.selectedTimePeriod = period as 'today' | 'this_week' | 'this_month' | 'custom';
    this.showCustomDatePicker = period === 'custom';

    if (period !== 'custom') {
      this.customDateRange = { from: null, to: null };
    }

    // Update KPI labels for new period
    this.updateKPILabels();

    // Update auto-refresh based on period
    this.setupAutoRefresh();

    // Reload data with new period (only if not custom or if custom dates are set)
    if (period !== 'custom' || (this.customDateRange.from && this.customDateRange.to)) {
      this.loadDashboardData();
    }
  }

  getCustomDateFromValue(): string {
    if (!this.customDateRange.from) return '';
    if (this.customDateRange.from instanceof Date) {
      return this.customDateRange.from.toISOString().split('T')[0];
    }
    return String(this.customDateRange.from);
  }

  getCustomDateToValue(): string {
    if (!this.customDateRange.to) return '';
    if (this.customDateRange.to instanceof Date) {
      return this.customDateRange.to.toISOString().split('T')[0];
    }
    return String(this.customDateRange.to);
  }

  onCustomDateFromChange(event: any): void {
    const value = event.target.value;
    this.customDateRange.from = value ? new Date(value) : null;
    if (this.customDateRange.from && this.customDateRange.to) {
      this.loadDashboardData();
    }
  }

  onCustomDateToChange(event: any): void {
    const value = event.target.value;
    this.customDateRange.to = value ? new Date(value) : null;
    if (this.customDateRange.from && this.customDateRange.to) {
      this.loadDashboardData();
    }
  }

  formatLastUpdate(): string {
    if (!this.lastUpdate) return 'Never';

    const now = new Date();
    const diffMs = now.getTime() - this.lastUpdate.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;

    return this.lastUpdate.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  }

  getKPILabel(kpiKey: string): string {
    let translationKey = '';
    
    switch (kpiKey) {
      case 'revenue':
        switch (this.selectedTimePeriod) {
          case 'today':
            translationKey = 'DASHBOARD.KPIS.TODAYS_REVENUE';
            break;
          case 'this_week':
            translationKey = 'DASHBOARD.KPIS.THIS_WEEKS_REVENUE';
            break;
          case 'this_month':
            translationKey = 'DASHBOARD.KPIS.THIS_MONTHS_REVENUE';
            break;
          case 'custom':
            translationKey = 'DASHBOARD.KPIS.CUSTOM_REVENUE';
            break;
          default:
            translationKey = 'DASHBOARD.KPIS.TODAYS_REVENUE';
        }
        break;
      case 'services':
        switch (this.selectedTimePeriod) {
          case 'today':
            translationKey = 'DASHBOARD.KPIS.SERVICES_TODAY';
            break;
          case 'this_week':
            translationKey = 'DASHBOARD.KPIS.SERVICES_THIS_WEEK';
            break;
          case 'this_month':
            translationKey = 'DASHBOARD.KPIS.SERVICES_THIS_MONTH';
            break;
          case 'custom':
            translationKey = 'DASHBOARD.KPIS.SERVICES_CUSTOM';
            break;
          default:
            translationKey = 'DASHBOARD.KPIS.SERVICES_TODAY';
        }
        break;
      case 'new_customers':
        switch (this.selectedTimePeriod) {
          case 'today':
            translationKey = 'DASHBOARD.KPIS.NEW_CUSTOMERS_TODAY';
            break;
          case 'this_week':
            translationKey = 'DASHBOARD.KPIS.NEW_CUSTOMERS_THIS_WEEK';
            break;
          case 'this_month':
            translationKey = 'DASHBOARD.KPIS.NEW_CUSTOMERS_THIS_MONTH';
            break;
          case 'custom':
            translationKey = 'DASHBOARD.KPIS.NEW_CUSTOMERS_CUSTOM';
            break;
          default:
            translationKey = 'DASHBOARD.KPIS.NEW_CUSTOMERS_TODAY';
        }
        break;
      default:
        return '';
    }
    
    return this.translate.instant(translationKey);
  }

  updateKPILabels(): void {
    const revenueKPI = this.kpis.find(k => k.key === 'revenue');
    if (revenueKPI) {
      revenueKPI.label = this.getKPILabel('revenue');
      revenueKPI.change = this.translate.instant('DASHBOARD.KPIS.LOADING');
    }

    const servicesKPI = this.kpis.find(k => k.key === 'services');
    if (servicesKPI) {
      servicesKPI.label = this.getKPILabel('services');
      servicesKPI.change = this.translate.instant('DASHBOARD.KPIS.LOADING');
    }

    const carsKPI = this.kpis.find(k => k.key === 'cars_in_queue');
    if (carsKPI) {
      carsKPI.label = this.translate.instant('DASHBOARD.KPIS.CARS_IN_QUEUE');
      carsKPI.change = this.translate.instant('DASHBOARD.KPIS.CURRENT');
    }

    const customersKPI = this.kpis.find(k => k.key === 'new_customers');
    if (customersKPI) {
      customersKPI.label = this.getKPILabel('new_customers');
      customersKPI.change = this.translate.instant('DASHBOARD.KPIS.LOADING');
    }
  }

  getStatusClass(status: string): string {
    const baseClasses = 'px-2 py-1 text-xs font-medium rounded-full';
    switch (status) {
      case 'COMPLETED':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'IN_PROGRESS':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case 'PENDING':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'QC':
        return `${baseClasses} bg-purple-100 text-purple-800`;
      case 'PAID':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'CANCELLED':
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  }
}
