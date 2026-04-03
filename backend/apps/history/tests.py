from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIRequestFactory, force_authenticate

from .models import History
from .serializers import CreateHistorySerializer, ListHistorySerializer
from .views import HistoryView

User = get_user_model()


class HistoryTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="history@example.com",
            password="StrongPass1@",
            first_name="History",
            last_name="User",
            phone_number="9988776655",
        )
        self.factory = APIRequestFactory()

    def test_create_serializer_accepts_sensor_fields_only(self):
        serializer = CreateHistorySerializer(
            data={
                "gas_level": 10.5,
                "temperature": 32.1,
                "pressure": 1012.3,
                "smoke_level": 2.7,
            }
        )

        self.assertTrue(serializer.is_valid(), serializer.errors)

    @patch("apps.history.views.predict")
    def test_history_post_populates_prediction_fields_from_predict_module(self, mock_predict):
        mock_predict.return_value = {
            "alarm": 1,
            "probability": 94.0,
            "status": "Alarm! Hazard Detected!",
            "prediction_label": "hazard",
            "confidence_score": 94.0,
        }

        request = self.factory.post(
            "/history/user/history/",
            {
                "gas_level": 10.5,
                "temperature": 32.1,
                "pressure": 1012.3,
                "smoke_level": 2.7,
            },
            format="json",
        )
        force_authenticate(request, user=self.user)

        response = HistoryView.as_view()(request)

        self.assertEqual(response.status_code, 201)
        self.assertEqual(History.objects.count(), 1)

        history = History.objects.get()
        self.assertEqual(history.prediction_label, "hazard")
        self.assertEqual(history.confidence_score, 94.0)

        mock_predict.assert_called_once_with(
            gas_level=10.5,
            temperature=32.1,
            pressure=1012.3,
            smoke_level=2.7,
        )

    def test_list_serializer_includes_prediction_fields(self):
        history = History.objects.create(
            user=self.user,
            gas_level=10.5,
            temperature=32.1,
            pressure=1012.3,
            smoke_level=2.7,
            prediction_label="safe",
            confidence_score=12.0,
        )

        data = ListHistorySerializer(history).data

        self.assertEqual(data["prediction_label"], "safe")
        self.assertEqual(data["confidence_score"], 12.0)
