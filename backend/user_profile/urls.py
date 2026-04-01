from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView, TokenVerifyView

from .views import (
    UserEditProfileView,
    UserListView,
    UserLoginView,
    UserLogoutView,
    UserRegisterView,
    UserViewProfileView,
)

app_name = 'users'

urlpatterns = [
    path('register/', UserRegisterView.as_view(), name='user-register'),
    path('login/', UserLoginView.as_view(), name='user-login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('token/verify/', TokenVerifyView.as_view(), name='token-verify'),
    path('logout/', UserLogoutView.as_view(), name='user-logout'),
    path('edit-profile/', UserEditProfileView.as_view(), name='user-edit-profile'),
    path('profile/', UserViewProfileView.as_view(), name='user-view-profile'),
    path('list/', UserListView.as_view(), name='user-list'),
]
