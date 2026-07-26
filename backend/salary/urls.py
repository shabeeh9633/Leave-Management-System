from django.urls import path
from .views import SalaryCalculateView

urlpatterns = [
    path('salary/calculate/', SalaryCalculateView.as_view(), name='salary_calculate'),
]
