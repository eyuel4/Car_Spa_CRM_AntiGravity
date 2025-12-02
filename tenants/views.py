from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Tenant, Shop
from .serializers import TenantSerializer, ShopSerializer

class TenantViewSet(viewsets.ModelViewSet):
    queryset = Tenant.objects.all()
    serializer_class = TenantSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    @action(detail=True, methods=['patch'], url_path='update-language')
    def update_language(self, request, pk=None):
        """Update tenant language preference (Owner only)"""
        tenant = self.get_object()
        
        # Check if user is owner of this tenant
        if request.user.role != 'OWNER' or request.user.tenant != tenant:
            return Response(
                {'error': 'Only tenant owners can update language settings'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        language = request.data.get('language')
        
        if language not in ['en', 'es', 'am']:
            return Response(
                {'error': 'Invalid language code. Supported: en, es, am'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        tenant.language = language
        tenant.save(update_fields=['language'])
        
        return Response({
            'language': tenant.language,
            'message': 'Tenant language updated successfully'
        })

class ShopViewSet(viewsets.ModelViewSet):
    serializer_class = ShopSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff: # Admin sees all
             return Shop.objects.all()
        # Filter by user's tenant
        if user.tenant:
            return Shop.objects.filter(tenant=user.tenant)
        return Shop.objects.none()

    def perform_create(self, serializer):
        # Automatically assign tenant from user
        if self.request.user.tenant:
            serializer.save(tenant=self.request.user.tenant)
        else:
            # Fallback or error if no tenant (should be handled)
            serializer.save()
