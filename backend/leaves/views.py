from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone

from .models import LeaveType, PublicHoliday, LeaveRequest
from .serializers import LeaveTypeSerializer, PublicHolidaySerializer, LeaveRequestSerializer
from .services import calculate_working_days, requires_manager_approval
from users.permissions import IsHR, IsManager, IsHRorManager


class IsHROrReadOnly(permissions.BasePermission):
    """HR can write; any authenticated user can read."""
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
    http_method_names = ['get', 'post', 'head', 'options']  # no PUT/PATCH/DELETE on leave requests

    def get_queryset(self):
        user = self.request.user

        if user.role == 'HR':
            # HR sees ALL leave requests
            return LeaveRequest.objects.all().order_by('-applied_at')

        elif user.role == 'MANAGER':
            # Manager sees ONLY requests that required Manager approval
            # i.e. requests currently PENDING that satisfy the approval rules.
            # We filter by status PENDING (these are the ones awaiting manager action)
            # and only those that are in PENDING state (i.e. required approval).
            # Already-approved/rejected ones are also shown for reference.
            return LeaveRequest.objects.filter(
                needs_manager_approval=True
            ).order_by('-applied_at')

        # Employee sees only their own leaves
        return LeaveRequest.objects.filter(employee=user).order_by('-applied_at')

    def create(self, request, *args, **kwargs):
        # Only EMPLOYEE role can submit leave applications
        if request.user.role != 'EMPLOYEE':
            return Response(
                {'detail': 'Only employees can submit leave requests.'},
                status=status.HTTP_403_FORBIDDEN
            )

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
        needs_approval = requires_manager_approval(request.user, working_days)

        if needs_approval:
            initial_status = LeaveRequest.Status.PENDING
        else:
            initial_status = LeaveRequest.Status.APPROVED

        leave_request = serializer.save(
            employee=request.user,
            working_days=working_days,
            status=initial_status,
            needs_manager_approval=needs_approval,
        )

        return Response(
            LeaveRequestSerializer(leave_request).data,
            status=status.HTTP_201_CREATED
        )

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        leave = self.get_object()

        # Only the owner employee can cancel their own pending leave
        if leave.employee != request.user and request.user.role not in ['HR']:
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

        # Managers can only act on requests that require manager approval
        if user.role == 'MANAGER' and not leave.needs_manager_approval:
            return Response(
                {'detail': 'This leave request does not require Manager approval.'},
                status=status.HTTP_400_BAD_REQUEST
            )

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

        # Managers can only act on requests that require manager approval
        if user.role == 'MANAGER' and not leave.needs_manager_approval:
            return Response(
                {'detail': 'This leave request does not require Manager approval.'},
                status=status.HTTP_400_BAD_REQUEST
            )

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
