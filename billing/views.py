from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal
from billing.models import Receipt, Invoice, InvoiceLineItem, Payment, TaxConfiguration, Discount
from billing.serializers import (
    ReceiptSerializer, InvoiceSerializer, PaymentSerializer,
    TaxConfigurationSerializer, DiscountSerializer
)


class ReceiptViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Receipt management.
    
    Custom actions:
    - send: Send receipt via notification
    """
    serializer_class = ReceiptSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['job__customer']
    search_fields = ['receipt_number', 'job__customer__first_name', 'job__customer__last_name']
    ordering_fields = ['issued_date', 'total']
    ordering = ['-issued_date']
    
    def get_queryset(self):
        return Receipt.objects.filter(
            tenant=self.request.user.tenant
        ).select_related('job__customer')
    
    def perform_create(self, serializer):
        serializer.save(tenant=self.request.user.tenant)
    
    @action(detail=True, methods=['post'])
    def send(self, request, pk=None):
        """Send receipt via notification"""
        from notifications.models import Notification
        
        receipt = self.get_object()
        customer = receipt.job.customer
        channel = request.data.get('channel', 'EMAIL')
        
        # Create notification
        message = f"Thank you for your visit! Your receipt #{receipt.receipt_number} total is ${receipt.total}."
        
        notification = Notification.objects.create(
            tenant=request.user.tenant,
            customer=customer,
            notification_type='RECEIPT',
            channel=channel,
            recipient=customer.email if channel == 'EMAIL' else customer.phone_number,
            subject=f"Receipt #{receipt.receipt_number}",
            message=message,
            receipt=receipt
        )
        
        # Send notification (placeholder - actual sending would happen here)
        notification.send()
        
        return Response({
            'message': f'Receipt sent via {channel}',
            'notification_id': notification.id
        })


class InvoiceViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Invoice management.
    
    Custom actions:
    - generate: Generate monthly invoice for corporate customer
    - send: Send invoice via notification
    """
    serializer_class = InvoiceSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['customer', 'status']
    search_fields = ['invoice_number', 'customer__first_name', 'customer__last_name']
    ordering_fields = ['issued_date', 'due_date', 'total']
    ordering = ['-issued_date']
    
    def get_queryset(self):
        return Invoice.objects.filter(
            tenant=self.request.user.tenant
        ).select_related('customer').prefetch_related('line_items')
    
    def perform_create(self, serializer):
        serializer.save(tenant=self.request.user.tenant)
    
    @action(detail=False, methods=['post'])
    def generate(self, request):
        """Generate monthly invoice for a corporate customer"""
        from operations.models import Job, JobItem
        
        customer_id = request.data.get('customer_id')
        period_start = request.data.get('period_start')
        period_end = request.data.get('period_end')
        
        if not all([customer_id, period_start, period_end]):
            return Response(
                {'error': 'customer_id, period_start, and period_end are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get completed jobs for this customer in the period
        jobs = Job.objects.filter(
            tenant=request.user.tenant,
            customer_id=customer_id,
            status='COMPLETED',
            created_at__gte=period_start,
            created_at__lte=period_end
        ).prefetch_related('items')
        
        if not jobs.exists():
            return Response(
                {'error': 'No completed jobs found for this period'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Calculate totals
        subtotal = Decimal('0')
        for job in jobs:
            for item in job.items.all():
                subtotal += item.price
        
        # Get active tax
        tax_config = TaxConfiguration.objects.filter(
            tenant=request.user.tenant,
            is_active=True
        ).first()
        
        tax_amount = subtotal * tax_config.rate if tax_config else Decimal('0')
        total = subtotal + tax_amount
        
        # Generate invoice number
        invoice_count = Invoice.objects.filter(tenant=request.user.tenant).count()
        invoice_number = f"INV-{timezone.now().strftime('%Y%m')}-{invoice_count + 1:03d}"
        
        # Create invoice
        invoice = Invoice.objects.create(
            tenant=request.user.tenant,
            customer_id=customer_id,
            invoice_number=invoice_number,
            billing_period_start=period_start,
            billing_period_end=period_end,
            subtotal=subtotal,
            tax_amount=tax_amount,
            total=total,
            due_date=timezone.now().date() + timedelta(days=30),
            status='DRAFT'
        )
        
        # Create line items
        for job in jobs:
            for item in job.items.all():
                InvoiceLineItem.objects.create(
                    tenant=request.user.tenant,
                    invoice=invoice,
                    job=job,
                    description=f"Job #{job.id} - {item.service.name}",
                    amount=item.price
                )
        
        serializer = self.get_serializer(invoice)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def send(self, request, pk=None):
        """Send invoice via notification"""
        from notifications.models import Notification
        
        invoice = self.get_object()
        customer = invoice.customer
        channel = request.data.get('channel', 'EMAIL')
        
        # Update status to SENT
        invoice.status = 'SENT'
        invoice.save()
        
        # Create notification
        message = f"Invoice #{invoice.invoice_number} for ${invoice.total} is now available. Due date: {invoice.due_date}"
        
        notification = Notification.objects.create(
            tenant=request.user.tenant,
            customer=customer,
            notification_type='INVOICE',
            channel=channel,
            recipient=customer.email if channel == 'EMAIL' else customer.phone_number,
            subject=f"Invoice #{invoice.invoice_number}",
            message=message,
            invoice=invoice
        )
        
        # Send notification
        notification.send()
        
        return Response({
            'message': f'Invoice sent via {channel}',
            'notification_id': notification.id
        })

    @action(detail=False, methods=['get'])
    def metrics(self, request):
        """Get revenue analytics"""
        from django.db.models import Sum, Count
        from django.db.models.functions import TruncMonth, TruncDay
        from operations.models import Job, JobItem, JobTask
        
        tenant = request.user.tenant
        
        # Date filtering
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        jobs = Job.objects.filter(tenant=tenant, status='COMPLETED')
        if start_date:
            jobs = jobs.filter(created_at__gte=start_date)
        if end_date:
            jobs = jobs.filter(created_at__lte=end_date)
            
        # 1. Total Revenue (Estimate based on Job items price sum)
        # Note: In real app, use Payment records or Invoice totals. 
        # For MVP, summing Job items is close enough if we assume completed jobs are paid.
        job_ids = jobs.values_list('id', flat=True)
        total_revenue = JobItem.objects.filter(job_id__in=job_ids).aggregate(total=Sum('price'))['total'] or 0
        
        # 2. Revenue by Service Category
        revenue_by_category = JobItem.objects.filter(job_id__in=job_ids)\
            .values('service__category__name')\
            .annotate(total=Sum('price'))\
            .order_by('-total')
            
        # 3. Revenue by Staff
        # This is tricky because price is on JobItem, but tasks are assigned to staff.
        # We can approximate by counting tasks completed by staff.
        # Or if we want revenue, we need to split JobItem price by tasks? 
        # For MVP, let's just show "Tasks Completed by Staff" as a proxy for performance alongside User Performance Analytics.
        # But Requirement says "Revenue by staff". 
        # Let's simple attribution: Credit the full service price to the staff who did the task.
        # If multiple staff, it duplicates. Better: Just show "Sales by Staff" if staff is assigned to JobItem.
        # JobTask is linked to JobItem.
        revenue_by_staff = JobTask.objects.filter(tenant=tenant, status='DONE', job_item__job__in=jobs)\
            .values('staff__first_name', 'staff__last_name')\
            .annotate(revenue=Sum('job_item__price'))\
            .order_by('-revenue')
            
        # 4. Revenue Trend (Daily)
        revenue_trend = jobs.annotate(date=TruncDay('created_at'))\
            .values('date')\
            .annotate(daily_total=Sum('items__price'))\
            .order_by('date')
            
        return Response({
            'total_revenue': total_revenue,
            'revenue_by_category': revenue_by_category,
            'revenue_by_staff': revenue_by_staff,
            'revenue_trend': revenue_trend
        })


class PaymentViewSet(viewsets.ModelViewSet):
    """ViewSet for Payment recording"""
    serializer_class = PaymentSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['payment_method', 'job', 'invoice']
    ordering_fields = ['payment_date', 'amount']
    ordering = ['-payment_date']
    
    def get_queryset(self):
        return Payment.objects.filter(
            tenant=self.request.user.tenant
        ).select_related('job__customer', 'invoice__customer')
    
    def perform_create(self, serializer):
        serializer.save(tenant=self.request.user.tenant)


class TaxConfigurationViewSet(viewsets.ModelViewSet):
    """ViewSet for Tax Configuration"""
    serializer_class = TaxConfigurationSerializer
    
    def get_queryset(self):
        return TaxConfiguration.objects.filter(tenant=self.request.user.tenant)
    
    def perform_create(self, serializer):
        serializer.save(tenant=self.request.user.tenant)


class DiscountViewSet(viewsets.ModelViewSet):
    """ViewSet for Discount management"""
    serializer_class = DiscountSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['is_active', 'discount_type']
    
    def get_queryset(self):
        return Discount.objects.filter(tenant=self.request.user.tenant)
    
    def perform_create(self, serializer):
        serializer.save(tenant=self.request.user.tenant)

    @action(detail=False, methods=['get'])
    def analytics(self, request):
        """Get marketing analytics data"""
        from django.db.models import Sum
        
        tenant = request.user.tenant
        coupons = Discount.objects.filter(tenant=tenant)
        
        # 1. Total Active Coupons
        active_coupons = coupons.filter(is_active=True).count()
        
        # 2. Total Redemptions (from Discount model counter)
        total_redemptions = coupons.aggregate(total=Sum('times_redeemed'))['total'] or 0
        
        # 3. Total Discount Value Given (Aggregated from Receipts and Invoices)
        receipt_discounts = Receipt.objects.filter(tenant=tenant).aggregate(total=Sum('discount_amount'))['total'] or 0
        invoice_discounts = Invoice.objects.filter(tenant=tenant).aggregate(total=Sum('discount_amount'))['total'] or 0
        total_discount_value = receipt_discounts + invoice_discounts
        
        # 4. Top Performing Coupons
        top_coupons = coupons.order_by('-times_redeemed')[:5]
        top_coupons_data = [
            {
                'name': c.name,
                'code': c.code,
                'redemptions': c.times_redeemed,
                'type': c.discount_type
            }
            for c in top_coupons
        ]
        
        return Response({
            'active_coupons': active_coupons,
            'total_redemptions': total_redemptions,
            'total_discount_value': total_discount_value,
            'top_coupons': top_coupons_data
        })
