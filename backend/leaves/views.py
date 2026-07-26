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
            # HR sees EVERY leave request, regardless of status or manager approval requirement
            return LeaveRequest.objects.all().order_by('-applied_at')

        elif user.role == 'MANAGER':
            # Manager sees ONLY leave requests that require Manager approval
            # (Rule 1: > 2 working days; Rule 2: 3rd+ request in calendar month)
            return LeaveRequest.objects.filter(
                needs_manager_approval=True
            ).order_by('-applied_at')

        # Employee sees only their own leave requests
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

        # Every leave request starts in PENDING status. No automatic approval.
        initial_status = LeaveRequest.Status.PENDING

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
        user = request.user
        leave = self.get_object()

        # Permission check:
        # - Employee can cancel only their own leave
        # - Manager can cancel PENDING requests that require manager approval (in their queue)
        # - HR can cancel any PENDING leave request
        if user.role == 'EMPLOYEE' and leave.employee != user:
            return Response(
                {'detail': 'You can only cancel your own leave requests.'},
                status=status.HTTP_403_FORBIDDEN
            )
        elif user.role == 'MANAGER' and not leave.needs_manager_approval:
            return Response(
                {'detail': 'Manager can only cancel requests that require Manager approval.'},
                status=status.HTTP_403_FORBIDDEN
            )
        elif user.role not in ['EMPLOYEE', 'MANAGER', 'HR']:
            return Response(
                {'detail': 'You do not have permission to cancel this leave.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Transition rule: only PENDING requests can be cancelled
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

        # Cancelled is a terminal state
        if leave.status == LeaveRequest.Status.CANCELLED:
            return Response(
                {'detail': 'Cannot transition out of terminal state Cancelled.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Managers can only approve PENDING requests that require manager approval
        if user.role == 'MANAGER':
            if not leave.needs_manager_approval:
                return Response(
                    {'detail': 'This leave request does not require Manager approval.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            if leave.status != LeaveRequest.Status.PENDING:
                return Response(
                    {'detail': 'Manager can only approve pending requests.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        # HR override: Pending -> Approved OR Rejected -> Approved
        if user.role == 'HR' and leave.status not in [LeaveRequest.Status.PENDING, LeaveRequest.Status.REJECTED]:
            return Response(
                {'detail': f'Cannot approve a request with status {leave.status}.'},
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

        # Cancelled is a terminal state
        if leave.status == LeaveRequest.Status.CANCELLED:
            return Response(
                {'detail': 'Cannot transition out of terminal state Cancelled.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Managers can only reject PENDING requests that require manager approval
        if user.role == 'MANAGER':
            if not leave.needs_manager_approval:
                return Response(
                    {'detail': 'This leave request does not require Manager approval.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            if leave.status != LeaveRequest.Status.PENDING:
                return Response(
                    {'detail': 'Manager can only reject pending requests.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        # HR override: Pending -> Rejected OR Approved -> Rejected
        if user.role == 'HR' and leave.status not in [LeaveRequest.Status.PENDING, LeaveRequest.Status.APPROVED]:
            return Response(
                {'detail': f'Cannot reject a request with status {leave.status}.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        leave.status = LeaveRequest.Status.REJECTED
        leave.reviewed_by = user
        leave.reviewed_at = timezone.now()
        leave.save()
        return Response(LeaveRequestSerializer(leave).data)
