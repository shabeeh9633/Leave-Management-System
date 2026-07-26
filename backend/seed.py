import os
import django
from datetime import date

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth import get_user_model
from leaves.models import LeaveType, PublicHoliday

User = get_user_model()

users_data = [
    {
        'username': 'hr_admin',
        'email': 'hr@example.com',
        'first_name': 'HR',
        'last_name': 'Admin',
        'role': User.Role.HR,
        'is_staff': True,
        'is_superuser': True,
        'password': 'password123',
        'monthly_salary': 8000.00
    },
    {
        'username': 'manager_user',
        'email': 'manager@example.com',
        'first_name': 'Manager',
        'last_name': 'User',
        'role': User.Role.MANAGER,
        'password': 'password123',
        'monthly_salary': 6000.00
    },
    {
        'username': 'employee_user',
        'email': 'employee@example.com',
        'first_name': 'Employee',
        'last_name': 'One',
        'role': User.Role.EMPLOYEE,
        'password': 'password123',
        'monthly_salary': 4000.00
    }
]

for udata in users_data:
    password = udata.pop('password')
    user, created = User.objects.get_or_create(username=udata['username'], defaults=udata)
    if created:
        user.set_password(password)
        user.save()
        print(f"Created user: {user.username}")
    else:
        print(f"User already exists: {user.username}")

leave_types = [
    {'name': 'Annual Leave', 'code': 'annual_leave', 'is_paid': True, 'description': 'Standard paid annual leave'},
    {'name': 'Sick Leave', 'code': 'sick_leave', 'is_paid': True, 'description': 'Paid medical or sick leave'},
    {'name': 'Casual Leave', 'code': 'casual_leave', 'is_paid': True, 'description': 'Casual short leave'},
    {'name': 'Unpaid Leave', 'code': 'unpaid_leave', 'is_paid': False, 'description': 'Leave without pay'},
]

for lt in leave_types:
    lt_obj, created = LeaveType.objects.get_or_create(name=lt['name'], defaults=lt)
    if created:
        print(f"Created LeaveType: {lt_obj.name}")

holidays = [
    {'name': 'New Year Day', 'date': date(2026, 1, 1)},
    {'name': 'Independence Day', 'date': date(2026, 7, 4)},
    {'name': 'Labor Day', 'date': date(2026, 9, 7)},
    {'name': 'Christmas Day', 'date': date(2026, 12, 25)},
]

for h in holidays:
    h_obj, created = PublicHoliday.objects.get_or_create(date=h['date'], defaults=h)
    if created:
        print(f"Created Holiday: {h_obj.name}")
