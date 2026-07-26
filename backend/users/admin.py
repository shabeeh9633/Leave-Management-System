from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import CustomUser


@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (
        (
            "Leave Management",
            {
                "fields": (
                    "role",
                    "monthly_salary",
                )
            },
        ),
    )

    add_fieldsets = UserAdmin.add_fieldsets + (
        (
            "Leave Management",
            {
                "classes": ("wide",),
                "fields": (
                    "role",
                    "monthly_salary",
                ),
            },
        ),
    )

    list_display = (
        "username",
        "email",
        "role",
        "monthly_salary",
        "is_staff",
        "is_active",
    )

    list_filter = (
        "role",
        "is_staff",
        "is_active",
    )