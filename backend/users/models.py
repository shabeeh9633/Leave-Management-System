from django.contrib.auth.models import AbstractUser
from django.db import models

class CustomUser(AbstractUser):
    class Role(models.TextChoices):
        EMPLOYEE = 'EMPLOYEE', 'Employee'
        MANAGER = 'MANAGER', 'Manager'
        HR = 'HR', 'HR'

    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.EMPLOYEE,
    )
    monthly_salary = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=5000.00
    )

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"
