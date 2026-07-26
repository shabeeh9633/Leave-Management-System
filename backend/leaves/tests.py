from django.test import TestCase
from datetime import date
from django.contrib.auth import get_user_model
from leaves.models import LeaveType, PublicHoliday, LeaveRequest
from leaves.services import calculate_working_days, requires_manager_approval

User = get_user_model()


class LeaveManagementTestCase(TestCase):
    def setUp(self):
        self.employee = User.objects.create_user(
            username='emp1',
            password='password123',
            role='EMPLOYEE'
        )
        self.manager = User.objects.create_user(
            username='mgr1',
            password='password123',
            role='MANAGER'
        )
        self.hr = User.objects.create_user(
            username='hr1',
            password='password123',
            role='HR'
        )

        self.annual_leave = LeaveType.objects.create(
            name='Annual Leave',
            code='annual',
            is_paid=True
        )

        # Public holiday on Friday, July 3rd, 2026
        self.holiday = PublicHoliday.objects.create(
            name='Holiday Test',
            date=date(2026, 7, 3)
        )

    def test_working_days_calculation(self):
        # Wed 2026-07-01 to Mon 2026-07-06 (6 calendar days)
        # 2026-07-01 (Wed): Working
        # 2026-07-02 (Thu): Working
        # 2026-07-03 (Fri): Holiday -> EXCLUDED
        # 2026-07-04 (Sat): Weekend -> EXCLUDED
        # 2026-07-05 (Sun): Weekend -> EXCLUDED
        # 2026-07-06 (Mon): Working
        # Total working days = 3
        days = calculate_working_days(date(2026, 7, 1), date(2026, 7, 6))
        self.assertEqual(days, 3)

    def test_rule_1_long_leave_requires_approval(self):
        # Leave exceeding 2 working days requires manager approval
        needs_approval = requires_manager_approval(self.employee, 3)
        self.assertTrue(needs_approval)

    def test_rule_2_frequent_requests(self):
        # 1st request <= 2 days -> does NOT require manager approval
        needs1 = requires_manager_approval(self.employee, 2)
        self.assertFalse(needs1)
        LeaveRequest.objects.create(
            employee=self.employee,
            leave_type=self.annual_leave,
            start_date=date(2026, 7, 1),
            end_date=date(2026, 7, 2),
            working_days=2,
            needs_manager_approval=needs1,
            status=LeaveRequest.Status.APPROVED,
            reason='1st request'
        )

        # 2nd request <= 2 days -> does NOT require manager approval
        needs2 = requires_manager_approval(self.employee, 1)
        self.assertFalse(needs2)
        LeaveRequest.objects.create(
            employee=self.employee,
            leave_type=self.annual_leave,
            start_date=date(2026, 7, 7),
            end_date=date(2026, 7, 7),
            working_days=1,
            needs_manager_approval=needs2,
            status=LeaveRequest.Status.APPROVED,
            reason='2nd request'
        )

        # 3rd request <= 2 days -> DOES require manager approval (Rule 2)
        needs3 = requires_manager_approval(self.employee, 1)
        self.assertTrue(needs3)
