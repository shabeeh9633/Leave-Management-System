from rest_framework import serializers
from .models import LeaveType, PublicHoliday, LeaveRequest
from users.serializers import UserSerializer

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

class LeaveRequestSerializer(serializers.ModelSerializer):
    employee_details = UserSerializer(source='employee', read_only=True)
    leave_type_details = LeaveTypeSerializer(source='leave_type', read_only=True)
    leave_type = serializers.PrimaryKeyRelatedField(queryset=LeaveType.objects.all())
    reviewed_by_username = serializers.CharField(source='reviewed_by.username', read_only=True)

    class Meta:
        model = LeaveRequest
        fields = [
            'id',
            'employee',
            'employee_details',
            'leave_type',
            'leave_type_details',
            'start_date',
            'end_date',
            'reason',
            'working_days',
            'needs_manager_approval',
            'status',
            'applied_at',
            'reviewed_by',
            'reviewed_by_username',
            'reviewed_at',
        ]
        read_only_fields = [
            'id', 'employee', 'working_days', 'needs_manager_approval',
            'status', 'applied_at', 'reviewed_by', 'reviewed_at'
        ]
