from unittest.mock import patch

from django.test import TestCase

from apps.prediction.ml.predict import get_label_confidence, predict


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
