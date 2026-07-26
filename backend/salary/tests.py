from django.test import TestCase
from datetime import date
from django.contrib.auth import get_user_model
from leaves.models import LeaveType, PublicHoliday, LeaveRequest
from salary.services import calculate_monthly_salary

User = get_user_model()


class SalaryCalculationTestCase(TestCase):
    def setUp(self):
        self.employee, _ = User.objects.get_or_create(
            username='sal_emp',
            defaults={
                'password': 'password123',
                'role': 'EMPLOYEE',
                'monthly_salary': 5000.00
            }
        )
        self.unpaid_leave_type, _ = LeaveType.objects.get_or_create(
            name='Loss Of Pay',
            defaults={
                'code': 'loss_of_pay',
                'is_paid': False
            }
        )
        self.paid_leave_type, _ = LeaveType.objects.get_or_create(
            name='Annual Leave',
            defaults={
                'code': 'annual_leave',
                'is_paid': True
            }
        )

        # Public holiday in July 2026 (July 3rd Fri)
        PublicHoliday.objects.get_or_create(
            date=date(2026, 7, 3),
            defaults={'name': 'Independence Holiday'}
        )

    def test_salary_calculation_with_leaves(self):
        # Approved paid leave (July 6-7, 2 days)
        LeaveRequest.objects.create(
            employee=self.employee,
            leave_type=self.paid_leave_type,
            start_date=date(2026, 7, 6),
            end_date=date(2026, 7, 7),
            working_days=2,
            status=LeaveRequest.Status.APPROVED,
            reason='Paid vacation'
        )

        # Approved unpaid leave (July 13-14, 2 days)
        LeaveRequest.objects.create(
            employee=self.employee,
            leave_type=self.unpaid_leave_type,
            start_date=date(2026, 7, 13),
            end_date=date(2026, 7, 14),
            working_days=2,
            status=LeaveRequest.Status.APPROVED,
            reason='Personal unpaid'
        )

        # Rejected unpaid leave (should NOT be included)
        LeaveRequest.objects.create(
            employee=self.employee,
            leave_type=self.unpaid_leave_type,
            start_date=date(2026, 7, 20),
            end_date=date(2026, 7, 21),
            working_days=2,
            status=LeaveRequest.Status.REJECTED,
            reason='Rejected leave'
        )

        result = calculate_monthly_salary(self.employee.id, 2026, 7)

        # July 2026: 31 days. Mon-Fri days = 23 days.
        # Public holidays = 1 (July 3rd).
        # Net standard working days = 22.
        # Approved paid leave = 2.
        # Approved unpaid leave = 2.
        # Payable days = 22 - 2 = 20.
        self.assertEqual(result['total_working_days'], 23)
        self.assertEqual(result['public_holidays'], 1)
        self.assertEqual(result['net_working_days'], 22)
        self.assertEqual(result['approved_paid_leave'], 2)
        self.assertEqual(result['unpaid_leave'], 2)
        self.assertEqual(result['payable_days'], 20)

        expected_final = round((5000.00 / 22) * 20, 2)
        self.assertEqual(result['final_salary_amount'], expected_final)
