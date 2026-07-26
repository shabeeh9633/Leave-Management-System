from rest_framework import serializers
from .models import LeaveType, PublicHoliday

class LeaveTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeaveType
        fields = ['id', 'name', 'code', 'is_paid', 'description']
        read_only_fields = ['id', 'code']

class PublicHolidaySerializer(serializers.ModelSerializer):
    class Meta:
        model = PublicHoliday
        fields = ['id', 'name', 'date']
        read_only_fields = ['id']
