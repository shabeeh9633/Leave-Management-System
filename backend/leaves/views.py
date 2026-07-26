from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from datetime import datetime

from .models import LeaveType, PublicHoliday, LeaveRequest
from .serializers import LeaveTypeSerializer, PublicHolidaySerializer, LeaveRequestSerializer
from .services import calculate_working_days, evaluate_approval_rules
from users.permissions import IsHR, IsManager, IsHRorManager

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

class LeaveRequestViewSet(viewsets.ModelViewSet):
    serializer_class = LeaveRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'HR':
            return LeaveRequest.objects.all()
        elif user.role == 'MANAGER':
            # Manager sees own leaves and leaves submitted by employees
            return LeaveRequest.objects.all()
        # Employee sees only their own leaves
        return LeaveRequest.objects.filter(employee=user)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        start_date = serializer.validated_data['start_date']
        end_date = serializer.validated_data['end_date']

        if start_date > end_date:
            return Response(
                {'detail': 'Start date cannot be after end date.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        working_days = calculate_working_days(start_date, end_date)
        initial_status = evaluate_approval_rules(request.user, working_days)

        leave_request = serializer.save(
            employee=request.user,
            working_days=working_days,
            status=initial_status
        )

        return Response(
            LeaveRequestSerializer(leave_request).data,
            status=status.HTTP_201_CREATED
        )

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        leave = self.get_object()
        
        # Check permissions: only owner employee or HR can cancel pending leave
        if leave.employee != request.user and request.user.role != 'HR':
            return Response(
                {'detail': 'You do not have permission to cancel this leave.'},
                status=status.HTTP_403_FORBIDDEN
            )

        if leave.status != LeaveRequest.Status.PENDING:
            return Response(
                {'detail': 'Only pending leave requests can be cancelled.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        leave.status = LeaveRequest.Status.CANCELLED
        leave.save()
        return Response(LeaveRequestSerializer(leave).data)

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        user = request.user
        if user.role not in ['MANAGER', 'HR']:
            return Response(
                {'detail': 'Only Manager or HR can approve leaves.'},
                status=status.HTTP_403_FORBIDDEN
            )

        leave = self.get_object()

        # Valid state transitions check
        if leave.status == LeaveRequest.Status.CANCELLED:
            return Response(
                {'detail': 'Cannot approve a cancelled leave request.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if user.role == 'MANAGER' and leave.status != LeaveRequest.Status.PENDING:
            return Response(
                {'detail': 'Manager can only approve pending requests.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # HR can approve pending or override rejected
        leave.status = LeaveRequest.Status.APPROVED
        leave.reviewed_by = user
        leave.reviewed_at = timezone.now()
        leave.save()
        return Response(LeaveRequestSerializer(leave).data)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        user = request.user
        if user.role not in ['MANAGER', 'HR']:
            return Response(
                {'detail': 'Only Manager or HR can reject leaves.'},
                status=status.HTTP_403_FORBIDDEN
            )

        leave = self.get_object()

        if leave.status == LeaveRequest.Status.CANCELLED:
            return Response(
                {'detail': 'Cannot reject a cancelled leave request.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if user.role == 'MANAGER' and leave.status != LeaveRequest.Status.PENDING:
            return Response(
                {'detail': 'Manager can only reject pending requests.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        leave.status = LeaveRequest.Status.REJECTED
        leave.reviewed_by = user
        leave.reviewed_at = timezone.now()
        leave.save()
        return Response(LeaveRequestSerializer(leave).data)
