from djoser.serializers import UserSerializer as BaseUserSerializer
from rest_framework import serializers
from users.models import User
from tenants.models import Tenant

class TenantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tenant
        fields = ['id', 'name', 'phone_number', 'website', 'language']

class UserSerializer(BaseUserSerializer):
    tenant = TenantSerializer(read_only=True)

    class Meta(BaseUserSerializer.Meta):
        model = User
        fields = BaseUserSerializer.Meta.fields + ('tenant', 'role', 'phone_number')
