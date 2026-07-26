from django.contrib import admin
from .models import LeaveType, PublicHoliday, LeaveRequest

admin.site.register(LeaveType)
admin.site.register(PublicHoliday)
admin.site.register(LeaveRequest)