from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

User = get_user_model()
CREATE_HR_URL = '/api/users/create-hr/'


def make_user(username, role, password='Test@12345'):
    return User.objects.create_user(username=username, password=password, role=role)


VALID_PAYLOAD = {
    'username': 'new_hr_user',
    'first_name': 'Jane',
    'last_name': 'Doe',
    'email': 'jane.doe@company.com',
    'password': 'Jane@12345',
    'confirm_password': 'Jane@12345',
    'monthly_salary': 80000.00,
}


class CreateHRUserTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.hr_user = make_user('hr_actor', 'HR')
        self.manager_user = make_user('mgr_actor', 'MANAGER')
        self.employee_user = make_user('emp_actor', 'EMPLOYEE')

    # ------------------------------------------------------------------ #
    # Access Control
    # ------------------------------------------------------------------ #

    def test_hr_can_create_hr_user(self):
        self.client.force_authenticate(user=self.hr_user)
        res = self.client.post(CREATE_HR_URL, VALID_PAYLOAD, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

        new_user = User.objects.get(username=VALID_PAYLOAD['username'])
        self.assertEqual(new_user.role, 'HR')
        self.assertTrue(new_user.check_password(VALID_PAYLOAD['password']))

    def test_manager_cannot_create_hr_user(self):
        self.client.force_authenticate(user=self.manager_user)
        res = self.client.post(CREATE_HR_URL, VALID_PAYLOAD, format='json')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_employee_cannot_create_hr_user(self):
        self.client.force_authenticate(user=self.employee_user)
        res = self.client.post(CREATE_HR_URL, VALID_PAYLOAD, format='json')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_unauthenticated_cannot_create_hr_user(self):
        res = self.client.post(CREATE_HR_URL, VALID_PAYLOAD, format='json')
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    # ------------------------------------------------------------------ #
    # Validation
    # ------------------------------------------------------------------ #

    def test_duplicate_username_rejected(self):
        self.client.force_authenticate(user=self.hr_user)
        payload = {**VALID_PAYLOAD, 'username': 'hr_actor'}  # existing username
        res = self.client.post(CREATE_HR_URL, payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('username', res.data)

    def test_duplicate_email_rejected(self):
        self.client.force_authenticate(user=self.hr_user)
        # Seed an existing user with the same email
        User.objects.create_user(
            username='existing_email_user',
            password='Test@12345',
            email='jane.doe@company.com',
            role='EMPLOYEE'
        )
        res = self.client.post(CREATE_HR_URL, VALID_PAYLOAD, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', res.data)

    def test_password_mismatch_rejected(self):
        self.client.force_authenticate(user=self.hr_user)
        payload = {**VALID_PAYLOAD, 'confirm_password': 'WrongPass999'}
        res = self.client.post(CREATE_HR_URL, payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_negative_salary_rejected(self):
        self.client.force_authenticate(user=self.hr_user)
        payload = {**VALID_PAYLOAD, 'monthly_salary': -100}
        res = self.client.post(CREATE_HR_URL, payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_role_is_always_hr(self):
        """Even if request body sends a different role, it must be saved as HR."""
        self.client.force_authenticate(user=self.hr_user)
        payload = {**VALID_PAYLOAD, 'username': 'sneaky_user'}
        res = self.client.post(CREATE_HR_URL, payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(User.objects.get(username='sneaky_user').role, 'HR')
