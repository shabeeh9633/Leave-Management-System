from rest_framework import viewsets, permissions
from .models import LeaveType, PublicHoliday
from .serializers import LeaveTypeSerializer, PublicHolidaySerializer
from users.permissions import IsHR

class IsHROrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.role == 'HR'

class LeaveTypeViewSet(viewsets.ModelViewSet):
    queryset = LeaveType.objects.all().order_by('id')
    serializer_class = LeaveTypeSerializer
    permission_classes = [IsHROrReadOnly]

class PublicHolidayViewSet(viewsets.ModelViewSet):
    queryset = PublicHoliday.objects.all().order_by('date')
    serializer_class = PublicHolidaySerializer
    permission_classes = [IsHROrReadOnly]
