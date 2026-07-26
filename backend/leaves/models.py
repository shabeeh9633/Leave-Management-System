from django.db import models

class LeaveType(models.Model):
    name = models.CharField(max_length=100, unique=True)
    code = models.CharField(max_length=50, unique=True, blank=True)
    is_paid = models.BooleanField(default=True)
    description = models.TextField(blank=True, null=True)

    def save(self, *args, **kwargs):
        if not self.code:
            self.code = self.name.lower().replace(' ', '_')
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} ({'Paid' if self.is_paid else 'Unpaid'})"

class PublicHoliday(models.Model):
    name = models.CharField(max_length=100)
    date = models.DateField(unique=True)

    class Meta:
        ordering = ['date']

    def __str__(self):
        return f"{self.name} ({self.date})"
