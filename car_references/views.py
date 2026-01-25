from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend

from car_references.models import CarMake, CarModel
from car_references.serializers import CarMakeSerializer, CarModelSerializer, CarModelListSerializer


class CarMakeViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Read-only API for car makes.
    Global reference data - not tenant-specific.
    """
    queryset = CarMake.objects.filter(is_active=True)
    serializer_class = CarMakeSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']
    
    @action(detail=True, methods=['get'])
    def models(self, request, pk=None):
        """Get all models for a specific make"""
        make = self.get_object()
        models = make.models.filter(is_active=True)
        serializer = CarModelListSerializer(models, many=True)
        return Response(serializer.data)


class CarModelViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Read-only API for car models.
    Global reference data - not tenant-specific.
    """
    queryset = CarModel.objects.filter(is_active=True).select_related('make')
    serializer_class = CarModelSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['make']
    search_fields = ['name', 'make__name']
    ordering_fields = ['name', 'make__name', 'created_at']
    ordering = ['make__name', 'name']
