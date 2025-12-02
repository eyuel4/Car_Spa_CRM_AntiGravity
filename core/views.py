from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal
from django.db.models import Sum, Count, Q
from django.db.models.functions import TruncDate

from billing.models import Receipt
from operations.models import Job, JobItem
from customers.models import Customer
from services.models import Service


class DashboardStatsView(APIView):
    """
    Dashboard statistics endpoint that aggregates KPI data, chart data, and recent services.
    Accepts period parameter: 'today', 'this_week', 'this_month', or 'custom'
    For custom period, requires date_from and date_to query parameters.
    """
    permission_classes = [IsAuthenticated]

    def get_date_range(self, period, date_from=None, date_to=None):
        """Calculate date range based on period parameter"""
        now = timezone.now()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        
        if period == 'today':
            return today_start, now
        elif period == 'this_week':
            # Start of week (Monday)
            days_since_monday = now.weekday()
            week_start = today_start - timedelta(days=days_since_monday)
            return week_start, now
        elif period == 'this_month':
            # Start of month
            month_start = today_start.replace(day=1)
            return month_start, now
        elif period == 'custom':
            if not date_from or not date_to:
                raise ValueError("date_from and date_to are required for custom period")
            from datetime import datetime
            try:
                # Parse ISO format dates
                date_from_dt = datetime.fromisoformat(date_from.replace('Z', '+00:00'))
                date_to_dt = datetime.fromisoformat(date_to.replace('Z', '+00:00'))
                # Make timezone-aware if not already
                if timezone.is_naive(date_from_dt):
                    date_from_dt = timezone.make_aware(date_from_dt)
                if timezone.is_naive(date_to_dt):
                    date_to_dt = timezone.make_aware(date_to_dt)
                # Set time to end of day for date_to
                date_to_dt = date_to_dt.replace(hour=23, minute=59, second=59, microsecond=999999)
                return date_from_dt, date_to_dt
            except Exception as e:
                raise ValueError(f"Invalid date format: {str(e)}")
        else:
            raise ValueError(f"Invalid period: {period}")

    def get(self, request):
        tenant = request.user.tenant
        period = request.query_params.get('period', 'today')
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')
        
        try:
            start_date, end_date = self.get_date_range(period, date_from, date_to)
        except ValueError as e:
            return Response({'error': str(e)}, status=400)
        
        # Revenue: Sum of receipts issued in the selected time period
        revenue = Receipt.objects.filter(
            tenant=tenant,
            issued_date__gte=start_date,
            issued_date__lte=end_date
        ).aggregate(total=Sum('total'))['total'] or Decimal('0')
        
        # Services: Count of jobs created in the selected time period
        services_count = Job.objects.filter(
            tenant=tenant,
            created_at__gte=start_date,
            created_at__lte=end_date
        ).count()
        
        # Cars in Queue: Count of jobs with status IN_PROGRESS or PENDING (current state, not time-bound)
        cars_in_queue = Job.objects.filter(
            tenant=tenant,
            status__in=['IN_PROGRESS', 'PENDING']
        ).count()
        
        # New Customers: Count of customers created in the selected time period
        new_customers = Customer.objects.filter(
            tenant=tenant,
            created_at__gte=start_date,
            created_at__lte=end_date
        ).count()
        
        # Services This Week: Daily breakdown of services for the selected time period
        # Group jobs by date
        daily_services = Job.objects.filter(
            tenant=tenant,
            created_at__gte=start_date,
            created_at__lte=end_date
        ).annotate(
            date=TruncDate('created_at')
        ).values('date').annotate(
            count=Count('id')
        ).order_by('date')
        
        services_this_week = [
            {
                'date': item['date'].strftime('%Y-%m-%d') if item['date'] else None,
                'count': item['count']
            }
            for item in daily_services
        ]
        
        # Top Services: Most popular services by count in the selected time period
        # Get service counts from JobItems
        top_services_data = JobItem.objects.filter(
            tenant=tenant,
            job__created_at__gte=start_date,
            job__created_at__lte=end_date
        ).values('service__id', 'service__name').annotate(
            count=Count('id')
        ).order_by('-count')[:10]
        
        top_services = [
            {
                'service_id': item['service__id'],
                'service_name': item['service__name'],
                'count': item['count']
            }
            for item in top_services_data
        ]
        
        # Recent Services: Latest 10 jobs with customer, car, service, staff, status info
        recent_jobs = Job.objects.filter(
            tenant=tenant
        ).select_related('customer', 'car').prefetch_related(
            'items__service', 'items__tasks__staff'
        ).order_by('-created_at')[:10]
        
        recent_services = []
        for job in recent_jobs:
            # Get first service from job items
            first_item = job.items.first()
            service_name = first_item.service.name if first_item else 'N/A'
            
            # Get staff from first task
            first_task = None
            if first_item:
                first_task = first_item.tasks.first()
            staff_name = f"{first_task.staff.first_name} {first_task.staff.last_name}" if first_task and first_task.staff else 'Unassigned'
            
            recent_services.append({
                'id': job.id,
                'time': job.created_at.strftime('%I:%M %p') if job.created_at else None,
                'customer': f"{job.customer.first_name} {job.customer.last_name}",
                'car': f"{job.car.make} {job.car.model} - {job.car.plate_number}",
                'service': service_name,
                'staff': staff_name,
                'status': job.status
            })
        
        return Response({
            'kpis': {
                'revenue': str(revenue),
                'services': services_count,
                'cars_in_queue': cars_in_queue,
                'new_customers': new_customers
            },
            'charts': {
                'services_this_week': services_this_week,
                'top_services': top_services
            },
            'recent_services': recent_services,
            'period': period,
            'date_range': {
                'from': start_date.isoformat(),
                'to': end_date.isoformat()
            }
        })
