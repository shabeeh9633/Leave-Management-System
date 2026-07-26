import calendar
from datetime import date, timedelta
from django.contrib.auth import get_user_model
from leaves.models import PublicHoliday, LeaveRequest

User = get_user_model()

def calculate_monthly_salary(employee_id: int, year: int, month: int) -> dict:
    employee = User.objects.get(id=employee_id)
    
    # 1. Get number of days in the month
    _, total_days_in_month = calendar.monthrange(year, month)
    month_start = date(year, month, 1)
    month_end = date(year, month, total_days_in_month)

    # 2. Get public holidays in the month
    holidays_in_month = set(
        PublicHoliday.objects.filter(
            date__range=(month_start, month_end)
        ).values_list('date', flat=True)
    )

    total_working_days = 0
    public_holidays_count = 0

    for day_num in range(1, total_days_in_month + 1):
        current_date = date(year, month, day_num)
        # Check Mon-Fri
        if current_date.weekday() < 5:
            total_working_days += 1
            if current_date in holidays_in_month:
                public_holidays_count += 1

    net_standard_working_days = total_working_days - public_holidays_count

    # 3. Calculate Approved Paid and Unpaid Leave days in month
    approved_leaves = LeaveRequest.objects.filter(
        employee=employee,
        status=LeaveRequest.Status.APPROVED,
        start_date__lte=month_end,
        end_date__gte=month_start
    )

    approved_paid_leave_days = 0
    unpaid_leave_days = 0

    for leave in approved_leaves:
        # Check overlapping dates within the target month
        overlap_start = max(leave.start_date, month_start)
        overlap_end = min(leave.end_date, month_end)
        
        current = overlap_start
        while current <= overlap_end:
            # Count only working days (Mon-Fri and non-holiday)
            if current.weekday() < 5 and current not in holidays_in_month:
                if leave.leave_type.is_paid:
                    approved_paid_leave_days += 1
                else:
                    unpaid_leave_days += 1
            current += timedelta(days=1)

    payable_days = max(0, net_standard_working_days - unpaid_leave_days)

    if net_standard_working_days > 0:
        daily_rate = float(employee.monthly_salary) / net_standard_working_days
        final_salary = round(daily_rate * payable_days, 2)
    else:
        daily_rate = 0.0
        final_salary = 0.0

    return {
        'employee_id': employee.id,
        'employee_username': employee.username,
        'employee_name': f"{employee.first_name} {employee.last_name}".strip() or employee.username,
        'base_monthly_salary': float(employee.monthly_salary),
        'year': year,
        'month': month,
        'total_working_days': total_working_days,
        'public_holidays': public_holidays_count,
        'net_working_days': net_standard_working_days,
        'approved_paid_leave': approved_paid_leave_days,
        'unpaid_leave': unpaid_leave_days,
        'payable_days': payable_days,
        'daily_rate': round(daily_rate, 2),
        'final_salary_amount': final_salary,
    }
