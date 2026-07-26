import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth import get_user_model

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
