from io import StringIO
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.test import TestCase

from apps.history.models import History
from apps.prediction.ml.predict import get_label_confidence, predict
from apps.prediction.models import RawData


User = get_user_model()


class PredictionTests(TestCase):
    def test_get_label_confidence_returns_safe_probability_for_safe_predictions(self):
        self.assertEqual(get_label_confidence(0.0571, "safe"), 94.29)

    def test_get_label_confidence_returns_hazard_probability_for_hazard_predictions(self):
        self.assertEqual(get_label_confidence(0.7423, "hazard"), 74.23)

    @patch("apps.prediction.ml.predict.get_model")
    def test_predict_returns_safe_confidence_for_safe_prediction(self, mock_get_model):
        class MockModel:
            @staticmethod
            def predict_proba(_input_data):
                return [[0.9429, 0.0571]]

        mock_get_model.return_value = (MockModel(), 0.42)

        result = predict(
            gas_level=50.0,
            temperature=28.0,
            pressure=1013.0,
            smoke_level=12.0,
        )

        self.assertEqual(result["prediction_label"], "safe")
        self.assertEqual(result["probability"], 5.71)
        self.assertEqual(result["confidence_score"], 94.29)


class SyncAndRetrainCommandTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="prediction@example.com",
            password="StrongPass1@",
            first_name="Predict",
            last_name="User",
            phone_number="9988776656",
        )

    def create_history(self, prediction_label="hazard", **overrides):
        values = {
            "user": self.user,
            "gas_level": 10.5,
            "temperature": 32.1,
            "pressure": 1012.3,
            "smoke_level": 2.7,
            "prediction_label": prediction_label,
            "confidence_score": 95.0,
        }
        values.update(overrides)
        return History.objects.create(**values)

    @patch("apps.prediction.management.commands.sync_and_retrain.train_pipeline")
    def test_command_inserts_new_rows_and_retrains(self, mock_train_pipeline):
        mock_train_pipeline.return_value = ("report", [[1, 0], [0, 1]])
        first = self.create_history(prediction_label="hazard")
        second = self.create_history(
            prediction_label="safe",
            gas_level=11.5,
            temperature=30.1,
            pressure=1010.0,
            smoke_level=1.2,
        )

        stdout = StringIO()
        call_command("sync_and_retrain", stdout=stdout)

        self.assertEqual(RawData.objects.count(), 2)
        self.assertEqual(
            set(RawData.objects.values_list("alarm", flat=True)),
            {0, 1},
        )
        self.assertTrue(
            RawData.objects.filter(
                timestamp=first.timestamp,
                gas_level=first.gas_level,
                temperature=first.temperature,
                pressure=first.pressure,
                smoke_level=first.smoke_level,
                alarm=1,
            ).exists()
        )
        self.assertTrue(
            RawData.objects.filter(
                timestamp=second.timestamp,
                gas_level=second.gas_level,
                temperature=second.temperature,
                pressure=second.pressure,
                smoke_level=second.smoke_level,
                alarm=0,
            ).exists()
        )
        mock_train_pipeline.assert_called_once()
        self.assertIn("Inserted 2 new rows into RawData.", stdout.getvalue())
        self.assertIn("Retraining completed successfully.", stdout.getvalue())

    @patch("apps.prediction.management.commands.sync_and_retrain.train_pipeline")
    def test_command_skips_retraining_when_there_is_no_new_data(self, mock_train_pipeline):
        history = self.create_history(prediction_label="hazard")
        RawData.objects.create(
            timestamp=history.timestamp,
            gas_level=history.gas_level,
            temperature=history.temperature,
            pressure=history.pressure,
            smoke_level=history.smoke_level,
            alarm=1,
        )

        stdout = StringIO()
        call_command("sync_and_retrain", stdout=stdout)

        self.assertEqual(RawData.objects.count(), 1)
        mock_train_pipeline.assert_not_called()
        self.assertIn("No new data", stdout.getvalue())

    @patch("apps.prediction.management.commands.sync_and_retrain.train_pipeline")
    def test_command_logs_retraining_failure_without_crashing(self, mock_train_pipeline):
        mock_train_pipeline.side_effect = RuntimeError("training failed")
        self.create_history(prediction_label="safe")

        stderr = StringIO()
        call_command("sync_and_retrain", stderr=stderr)

        self.assertEqual(RawData.objects.count(), 1)
        self.assertIn("retraining failed", stderr.getvalue().lower())

    @patch("apps.prediction.management.commands.sync_and_retrain.train_pipeline")
    def test_command_stops_when_history_label_cannot_be_mapped(self, mock_train_pipeline):
        self.create_history(prediction_label="unknown")

        stderr = StringIO()
        call_command("sync_and_retrain", stderr=stderr)

        self.assertEqual(RawData.objects.count(), 0)
        mock_train_pipeline.assert_not_called()
        self.assertIn("Sync failed before retraining", stderr.getvalue())
