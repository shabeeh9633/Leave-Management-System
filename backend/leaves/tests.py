from django.test import TestCase
from datetime import date
from django.contrib.auth import get_user_model
from leaves.models import LeaveType, PublicHoliday, LeaveRequest
from leaves.services import calculate_working_days, requires_manager_approval

User = get_user_model()


class LeaveManagementRuleTests(TestCase):
    def setUp(self):
        self.employee, _ = User.objects.get_or_create(
            username='emp_test',
            defaults={
                'password': 'password123',
                'role': 'EMPLOYEE'
            }
        )
        self.annual_leave, _ = LeaveType.objects.get_or_create(
            name='Annual Leave',
            defaults={
                'code': 'annual_leave',
                'is_paid': True
            }
        )

    def test_example_1_first_request_short_duration(self):
        # Example 1: Working Days = 1, Previous = 0 (1st request) -> Manager approval = NO
        needs_approval = requires_manager_approval(self.employee, 1)
        self.assertFalse(needs_approval)

    def test_example_2_second_request_short_duration(self):
        # Example 2: Working Days = 2, Previous = 1 (2nd request) -> Manager approval = NO
        LeaveRequest.objects.create(
            employee=self.employee,
            leave_type=self.annual_leave,
            start_date=date(2026, 7, 1),
            end_date=date(2026, 7, 1),
            working_days=1,
            needs_manager_approval=False,
            status=LeaveRequest.Status.PENDING,
            reason='1st request'
        )
        needs_approval = requires_manager_approval(self.employee, 2)
        self.assertFalse(needs_approval)

    def test_example_3_third_request_short_duration(self):
        # Example 3: Working Days = 1, Previous = 2 (3rd request) -> Manager approval = YES
        LeaveRequest.objects.create(
            employee=self.employee,
            leave_type=self.annual_leave,
            start_date=date(2026, 7, 1),
            end_date=date(2026, 7, 1),
            working_days=1,
            needs_manager_approval=False,
            status=LeaveRequest.Status.PENDING,
            reason='1st request'
        )
        LeaveRequest.objects.create(
            employee=self.employee,
            leave_type=self.annual_leave,
            start_date=date(2026, 7, 2),
            end_date=date(2026, 7, 3),
            working_days=2,
            needs_manager_approval=False,
            status=LeaveRequest.Status.PENDING,
            reason='2nd request'
        )
        needs_approval = requires_manager_approval(self.employee, 1)
        self.assertTrue(needs_approval)

    def test_example_4_fourth_request_short_duration(self):
        # Example 4: Working Days = 2, Previous = 3 (4th request) -> Manager approval = YES
        for i in range(3):
            LeaveRequest.objects.create(
                employee=self.employee,
                leave_type=self.annual_leave,
                start_date=date(2026, 7, 1 + i),
                end_date=date(2026, 7, 1 + i),
                working_days=1,
                needs_manager_approval=(i >= 2),
                status=LeaveRequest.Status.PENDING,
                reason=f'Request #{i+1}'
            )
        needs_approval = requires_manager_approval(self.employee, 2)
        self.assertTrue(needs_approval)

    def test_example_5_first_request_long_duration(self):
        # Example 5: Working Days = 5 (> 2), Previous = 0 -> Manager approval = YES (Rule 1)
        needs_approval = requires_manager_approval(self.employee, 5)
        self.assertTrue(needs_approval)
