from datetime import timedelta, date
from django.utils import timezone
from .models import PublicHoliday, LeaveRequest


def calculate_working_days(start_date: date, end_date: date) -> int:
    """
    Calculate working days between start_date and end_date (inclusive),
    excluding Saturdays, Sundays, and configured Public Holidays.
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
        # weekday(): 0=Mon, 1=Tue, ..., 4=Fri, 5=Sat, 6=Sun
        if current.weekday() < 5 and current not in holidays:
            working_days += 1
        current += timedelta(days=1)

    return working_days


def requires_manager_approval(employee, working_days: int) -> bool:
    """
    Determines whether a new leave request requires Manager approval.

    Step 1 — Rule 1:
        If working_days > 2 → needs_manager_approval = True

    Step 2 — Rule 2 (only checked when Rule 1 is not triggered):
        Count how many leave requests the employee has already submitted
        during the current calendar month (before this new request).

        already_submitted | this request is | needs_manager_approval
        ------------------+-----------------+------------------------
              0           |      1st        |  False
              1           |      2nd        |  False
              2           |      3rd        |  True
              3           |      4th        |  True
              4           |      5th        |  True
              ...         |      ...        |  True

        If already_submitted >= 2 → needs_manager_approval = True
        Otherwise                 → needs_manager_approval = False
    """
    # Rule 1: leave exceeding 2 working days requires Manager approval
    if working_days > 2:
        return True

    # Rule 2: 3rd and subsequent requests in the same calendar month
    today = timezone.now().date()
    already_submitted = LeaveRequest.objects.filter(
        employee=employee,
        applied_at__year=today.year,
        applied_at__month=today.month
    ).count()

    # already_submitted counts requests saved BEFORE this new one.
    # If 2 or more already exist, the current request is the 3rd or later.
    if already_submitted >= 2:
        return True

    return False
