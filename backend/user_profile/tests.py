from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken
from rest_framework_simplejwt.tokens import RefreshToken

from .models import UserProfile


class UserProfileFlowTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = UserProfile.objects.create_user(
            email='user@example.com',
            password='StrongPass1@',
            first_name='Regular',
            last_name='User',
            phone_number='9876543210',
        )
        self.admin_user = UserProfile.objects.create_user(
            email='admin@example.com',
            password='StrongPass1@',
            first_name='Admin',
            last_name='User',
            phone_number='9123456789',
            role='admin',
        )

    def _auth_headers(self, user):
        refresh = RefreshToken.for_user(user)
        return {'HTTP_AUTHORIZATION': f'Bearer {refresh.access_token}'}

    def test_registration_normalizes_email_and_phone_number(self):
        response = self.client.post(
            '/users/register/',
            {
                'email': 'NEWUSER@EXAMPLE.COM',
                'phone_number': '+919876543211',
                'first_name': 'New',
                'last_name': 'User',
                'password': 'StrongPass1@',
                'password_confirm': 'StrongPass1@',
            },
            format='json',
        )

        self.assertEqual(response.status_code, 201)
        created_user = UserProfile.objects.get(email='newuser@example.com')
        self.assertEqual(created_user.phone_number, '9876543211')
        self.assertEqual(created_user.username, 'newuser@example.com')

    def test_registration_blocks_duplicate_phone_number_after_normalization(self):
        response = self.client.post(
            '/users/register/',
            {
                'email': 'another@example.com',
                'phone_number': '+919876543210',
                'first_name': 'Another',
                'last_name': 'User',
                'password': 'StrongPass1@',
                'password_confirm': 'StrongPass1@',
            },
            format='json',
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn('phone_number', response.data['errors'])

    def test_login_returns_dynamic_token_expiry(self):
        response = self.client.post(
            '/users/login/',
            {
                'email': 'user@example.com',
                'password': 'StrongPass1@',
            },
            format='json',
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['expires_in'], 3600)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)

    def test_logout_blacklists_refresh_token_without_access_token(self):
        refresh = RefreshToken.for_user(self.user)
        response = self.client.post(
            '/users/logout/',
            {'refresh': str(refresh)},
            format='json',
        )

        self.assertEqual(response.status_code, 200)
        self.assertTrue(
            BlacklistedToken.objects.filter(token__jti=refresh['jti']).exists()
        )

    def test_password_change_blacklists_existing_refresh_tokens(self):
        refresh = RefreshToken.for_user(self.user)
        response = self.client.patch(
            '/users/edit-profile/',
            {
                'password': 'NewStrongPass1@',
                'password_confirm': 'NewStrongPass1@',
            },
            format='json',
            **self._auth_headers(self.user),
        )

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data['force_reauthentication'])
        self.assertTrue(
            BlacklistedToken.objects.filter(token__jti=refresh['jti']).exists()
        )

    def test_user_list_rejects_invalid_pagination(self):
        response = self.client.get(
            '/users/list/?page=0&per_page=500',
            format='json',
            **self._auth_headers(self.admin_user),
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn('pagination', response.data['errors'])

    def test_admin_role_is_synced_to_staff_flag(self):
        self.admin_user.refresh_from_db()
        self.assertTrue(self.admin_user.is_staff)

    def test_user_list_requires_admin_access(self):
        response = self.client.get(
            '/users/list/',
            format='json',
            **self._auth_headers(self.user),
        )

        self.assertEqual(response.status_code, 403)
