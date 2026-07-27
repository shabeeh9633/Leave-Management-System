from django.db import migrations
from django.contrib.auth.hashers import make_password


def reseed_users(apps, schema_editor):
    """
    Unconditionally ensures the three seed users exist and are active
    with the correct password. Safe to re-run: uses update-or-create.
    """
    CustomUser = apps.get_model('users', 'CustomUser')

    seed_users = [
        {
            'username': 'hr',
            'password': 'Hr@12345',
            'role': 'HR',
            'monthly_salary': 80000.00,
            'is_staff': True,
            'is_superuser': True,
            'is_active': True,
        },
        {
            'username': 'manager',
            'password': 'Manager@12345',
            'role': 'MANAGER',
            'monthly_salary': 60000.00,
            'is_staff': True,
            'is_superuser': False,
            'is_active': True,
        },
        {
            'username': 'employee',
            'password': 'Employee@12345',
            'role': 'EMPLOYEE',
            'monthly_salary': 30000.00,
            'is_staff': False,
            'is_superuser': False,
            'is_active': True,
        },
    ]

    for data in seed_users:
        password = data.pop('password')
        hashed = make_password(password)
        user, created = CustomUser.objects.get_or_create(
            username=data['username'],
            defaults={**data, 'password': hashed},
        )
        if not created:
            # Always overwrite password, role, salary, and active state
            user.password = hashed
            user.role = data['role']
            user.monthly_salary = data['monthly_salary']
            user.is_active = True
            user.is_staff = data['is_staff']
            user.is_superuser = data['is_superuser']
            user.save()


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0002_seed_initial_data'),
    ]

    operations = [
        migrations.RunPython(reseed_users, reverse_code=migrations.RunPython.noop),
    ]
