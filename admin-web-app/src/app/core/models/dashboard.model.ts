export interface DashboardStats {
  kpis: KPIData;
  charts: ChartData;
  recent_services: RecentService[];
  period: string;
  date_range: {
    from: string;
    to: string;
  };
}

export interface KPIData {
  revenue: string;
  services: number;
  cars_in_queue: number;
  new_customers: number;
}

export interface ChartData {
  services_this_week: ServiceWeekData[];
  top_services: TopServiceData[];
}

export interface ServiceWeekData {
  date: string | null;
  count: number;
}

export interface TopServiceData {
  service_id: number;
  service_name: string;
  count: number;
}

export interface RecentService {
  id: number;
  time: string | null;
  customer: string;
  car: string;
  service: string;
  staff: string;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'PENDING' | 'QC' | 'PAID' | 'CANCELLED';
}

