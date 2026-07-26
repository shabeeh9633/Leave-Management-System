from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.contrib.auth import get_user_model
from .services import calculate_monthly_salary
from users.permissions import IsHRorManager

User = get_user_model()

class SalaryCalculateView(APIView):
    permission_classes = [IsHRorManager]

    def get(self, request):
        employee_id = request.query_params.get('employee_id')
        year = request.query_params.get('year')
        month = request.query_params.get('month')

        if not employee_id or not year or not month:
            return Response(
                {'detail': 'Please provide employee_id, year, and month.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            employee_id = int(employee_id)
            year = int(year)
            month = int(month)
        except ValueError:
            return Response(
                {'detail': 'employee_id, year, and month must be valid integers.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not User.objects.filter(id=employee_id).exists():
            return Response(
                {'detail': f'Employee with ID {employee_id} not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        result = calculate_monthly_salary(employee_id, year, month)
        return Response(result, status=status.HTTP_200_OK)
