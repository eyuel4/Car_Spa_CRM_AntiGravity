from rest_framework import serializers
from billing.models import Receipt, Invoice, InvoiceLineItem, Payment, TaxConfiguration, Discount


class TaxConfigurationSerializer(serializers.ModelSerializer):
    class Meta:
        model = TaxConfiguration
        fields = ['id', 'name', 'rate', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class DiscountSerializer(serializers.ModelSerializer):
    class Meta:
        model = Discount
        fields = [
            'id', 'name', 'discount_type', 'value', 'is_active',
            'valid_from', 'valid_until', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class ReceiptSerializer(serializers.ModelSerializer):
    customer_name = serializers.SerializerMethodField()
    job_id = serializers.IntegerField(source='job.id', read_only=True)
    
    class Meta:
        model = Receipt
        fields = [
            'id', 'job', 'job_id', 'receipt_number', 'customer_name',
            'subtotal', 'tax_amount', 'discount_amount', 'total',
            'issued_date', 'created_at'
        ]
        read_only_fields = ['id', 'receipt_number', 'issued_date', 'created_at']
    
    def get_customer_name(self, obj):
        customer = obj.job.customer
        return f"{customer.first_name} {customer.last_name}"


class InvoiceLineItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = InvoiceLineItem
        fields = ['id', 'job', 'description', 'amount']
        read_only_fields = ['id']


class InvoiceSerializer(serializers.ModelSerializer):
    customer_name = serializers.SerializerMethodField()
    company_name = serializers.SerializerMethodField()
    line_items = InvoiceLineItemSerializer(many=True, read_only=True)
    
    class Meta:
        model = Invoice
        fields = [
            'id', 'customer', 'customer_name', 'company_name', 'invoice_number',
            'billing_period_start', 'billing_period_end',
            'subtotal', 'tax_amount', 'discount_amount', 'total',
            'issued_date', 'due_date', 'status', 'line_items',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'invoice_number', 'issued_date', 'created_at', 'updated_at']
    
    def get_customer_name(self, obj):
        return f"{obj.customer.first_name} {obj.customer.last_name}"
    
    def get_company_name(self, obj):
        if obj.customer.is_corporate and hasattr(obj.customer, 'corporate_profile'):
            return obj.customer.corporate_profile.company_name
        return None


class PaymentSerializer(serializers.ModelSerializer):
    customer_name = serializers.SerializerMethodField()
    reference_type = serializers.SerializerMethodField()
    reference_id = serializers.SerializerMethodField()
    
    class Meta:
        model = Payment
        fields = [
            'id', 'job', 'invoice', 'customer_name', 'reference_type', 'reference_id',
            'amount', 'payment_method', 'payment_date', 'transaction_reference',
            'notes', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']
    
    def get_customer_name(self, obj):
        if obj.job:
            customer = obj.job.customer
        elif obj.invoice:
            customer = obj.invoice.customer
        else:
            return None
        return f"{customer.first_name} {customer.last_name}"
    
    def get_reference_type(self, obj):
        if obj.job:
            return 'Receipt'
        elif obj.invoice:
            return 'Invoice'
        return None
    
    def get_reference_id(self, obj):
        if obj.job and hasattr(obj.job, 'receipt'):
            return obj.job.receipt.receipt_number
        elif obj.invoice:
            return obj.invoice.invoice_number
        return None
