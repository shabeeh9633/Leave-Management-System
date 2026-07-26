from django.test import TestCase
from datetime import date
from django.contrib.auth import get_user_model
from leaves.models import LeaveType, PublicHoliday, LeaveRequest
from leaves.services import calculate_working_days, evaluate_approval_rules

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

    def test_rule_1_long_leave(self):
        # Leave exceeding 2 working days requires manager approval (PENDING)
        status = evaluate_approval_rules(self.employee, 3)
        self.assertEqual(status, LeaveRequest.Status.PENDING)

    def test_rule_2_frequent_requests(self):
        # 1st request <= 2 days -> APPROVED
        status1 = evaluate_approval_rules(self.employee, 2)
        self.assertEqual(status1, LeaveRequest.Status.APPROVED)
        LeaveRequest.objects.create(
            employee=self.employee,
            leave_type=self.annual_leave,
            start_date=date(2026, 7, 1),
            end_date=date(2026, 7, 2),
            working_days=2,
            status=status1,
            reason='1st request'
        )

        # 2nd request <= 2 days -> APPROVED
        status2 = evaluate_approval_rules(self.employee, 1)
        self.assertEqual(status2, LeaveRequest.Status.APPROVED)
        LeaveRequest.objects.create(
            employee=self.employee,
            leave_type=self.annual_leave,
            start_date=date(2026, 7, 7),
            end_date=date(2026, 7, 7),
            working_days=1,
            status=status2,
            reason='2nd request'
        )

        # 3rd request <= 2 days -> PENDING (Rule 2 triggered)
        status3 = evaluate_approval_rules(self.employee, 1)
        self.assertEqual(status3, LeaveRequest.Status.PENDING)
