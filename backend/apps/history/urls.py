from django.urls import path
from .views import AdminHistoryView, HistoryView

urlpatterns = [
    path('', HistoryView.as_view(), name='user-history'),
    path('admin/', AdminHistoryView.as_view(), name='admin-history'),
]
