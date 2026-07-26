from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import LeaveTypeViewSet, PublicHolidayViewSet

router = DefaultRouter()
router.register(r'leave-types', LeaveTypeViewSet, basename='leave-types')
router.register(r'holidays', PublicHolidayViewSet, basename='holidays')

urlpatterns = [
    path('', include(router.urls)),
]
