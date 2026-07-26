from datetime import timedelta, date
from django.utils import timezone
from .models import PublicHoliday, LeaveRequest

def calculate_working_days(start_date: date, end_date: date) -> int:
    """
    Calculates working days between start_date and end_date (inclusive),
    excluding Saturdays, Sundays, and Public Holidays.
    """
    if start_date > end_date:
        return 0

    holidays = set(
        PublicHoliday.objects.filter(
            date__range=(start_date, end_date)
        ).values_list('date', flat=True)
    )

    current = start_date
    working_days = 0
    while current <= end_date:
        # weekday 0-4 are Mon-Fri, 5 is Sat, 6 is Sun
        if current.weekday() < 5 and current not in holidays:
            working_days += 1
        current += timedelta(days=1)

    return working_days


def requires_manager_approval(employee, working_days: int) -> bool:
    """
    Returns True if the leave request requires Manager approval.

    Rule 1: Continuous leave exceeding 2 working days requires Manager approval.
    Rule 2: The 3rd and every subsequent leave request submitted by the employee
            within the same calendar month requires Manager approval.

    Otherwise: Does NOT require Manager approval (will be auto-approved).
    """
    # Rule 1: Exceeding 2 working days
    if working_days > 2:
        return True

    # Rule 2: 3rd and subsequent requests in same calendar month
    today = timezone.now().date()
    requests_this_month_count = LeaveRequest.objects.filter(
        employee=employee,
        applied_at__year=today.year,
        applied_at__month=today.month
    ).count()

    # requests_this_month_count is the count of already submitted requests.
    # If >= 2 already exist, this new one is the 3rd or later.
    if requests_this_month_count >= 2:
        return True

    return False
