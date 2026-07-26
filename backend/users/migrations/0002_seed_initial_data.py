from django.db import migrations
from django.contrib.auth.hashers import make_password
from datetime import date


def seed_initial_data(apps, schema_editor):
    CustomUser = apps.get_model('users', 'CustomUser')
    LeaveType = apps.get_model('leaves', 'LeaveType')
    PublicHoliday = apps.get_model('leaves', 'PublicHoliday')

    # Seed Initial Users (HR, Manager, Employee)
    users_to_create = [
        {
            'username': 'hr',
            'password': 'Hr@12345',
            'role': 'HR',
            'monthly_salary': 80000.00,
            'is_staff': True,
            'is_superuser': True,
        },
        {
            'username': 'manager',
            'password': 'Manager@12345',
            'role': 'MANAGER',
            'monthly_salary': 60000.00,
            'is_staff': True,
            'is_superuser': False,
        },
        {
            'username': 'employee',
            'password': 'Employee@12345',
            'role': 'EMPLOYEE',
            'monthly_salary': 30000.00,
            'is_staff': False,
            'is_superuser': False,
        },
    ]

    for user_data in users_to_create:
        username = user_data['username']
        password = user_data['password']
        role = user_data['role']
        salary = user_data['monthly_salary']

        user = CustomUser.objects.filter(username=username).first()
        hashed_pw = make_password(password)

        if not user:
            CustomUser.objects.create(
                username=username,
                password=hashed_pw,
                role=role,
                monthly_salary=salary,
                is_staff=user_data['is_staff'],
                is_superuser=user_data['is_superuser'],
                is_active=True,
            )
        else:
            user.password = hashed_pw
            user.role = role
            user.monthly_salary = salary
            user.save()

    # Seed Initial Leave Types
    leave_types_to_create = [
        {'name': 'Annual Leave', 'code': 'annual_leave', 'is_paid': True},
        {'name': 'Sick Leave', 'code': 'sick_leave', 'is_paid': True},
        {'name': 'Casual Leave', 'code': 'casual_leave', 'is_paid': True},
        {'name': 'Loss Of Pay', 'code': 'loss_of_pay', 'is_paid': False},
    ]

    for lt_data in leave_types_to_create:
        if not LeaveType.objects.filter(name=lt_data['name']).exists():
            LeaveType.objects.create(
                name=lt_data['name'],
                code=lt_data['code'],
                is_paid=lt_data['is_paid'],
                description=f"{lt_data['name']} policy."
            )

    # Seed Sample Public Holidays
    sample_holidays = [
        {'name': "New Year's Day", 'date': date(2026, 1, 1)},
        {'name': 'Republic Day', 'date': date(2026, 1, 26)},
        {'name': 'Independence Day', 'date': date(2026, 8, 15)},
        {'name': 'Gandhi Jayanti', 'date': date(2026, 10, 2)},
        {'name': 'Christmas Day', 'date': date(2026, 12, 25)},
    ]

    for h_data in sample_holidays:
        if not PublicHoliday.objects.filter(date=h_data['date']).exists():
            PublicHoliday.objects.create(
                name=h_data['name'],
                date=h_data['date']
            )


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0001_initial'),
        ('leaves', '0003_leaverequest_needs_manager_approval'),
    ]

    operations = [
        migrations.RunPython(seed_initial_data, reverse_code=migrations.RunPython.noop),
    ]
