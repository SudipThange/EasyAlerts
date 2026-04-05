import logging
import os

import joblib
import pandas as pd

model_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "model.pkl")
_model = None
_threshold = None
logger = logging.getLogger(__name__)

# FN-FIX: hard rules that fire an alarm regardless of model output.
# Covers edge cases where a single sensor reading alone is dangerous enough
# to alarm without needing the model to agree.
HARD_ALARM_RULES = [
    lambda f: f["gas_level"] > 800,
    lambda f: f["smoke_level"] > 700 and f["temperature"] > 60,
    lambda f: f["temp_gas"] > 50000,

    # FIX 1: smoldering fire - high smoke even without heat or gas spike.
    # A slow fire or electrical burn produces heavy smoke before temperature rises.
    lambda f: f["smoke_level"] > 500,
]


def check_hard_rules(features: dict) -> bool:
    for rule in HARD_ALARM_RULES:
        if rule(features):
            return True
    return False


def get_model():
    global _model, _threshold
    if _model is None:
        logger.info("Loading prediction model from %s", model_path)
        payload = joblib.load(model_path)
        _model = payload["model"]
        _threshold = payload["threshold"]
        logger.info("Prediction model loaded successfully | Threshold=%.2f", _threshold)
    return _model, _threshold


def get_label_confidence(probability, prediction_label):
    hazard_probability = probability * 100
    if prediction_label == "hazard":
        return round(hazard_probability, 2)
    return round((1 - probability) * 100, 2)


def predict(gas_level, temperature, pressure, smoke_level):
    try:
        logger.info(
            "Running prediction for gas=%s temperature=%s pressure=%s smoke=%s",
            gas_level,
            temperature,
            pressure,
            smoke_level,
        )

        temp_gas = temperature * gas_level
        smoke_pressure = smoke_level * pressure

        features = {
            "gas_level": gas_level,
            "temperature": temperature,
            "pressure": pressure,
            "smoke_level": smoke_level,
            "temp_gas": temp_gas,
            "smoke_pressure": smoke_pressure,
        }

        # Hard rules checked before anything else.
        if check_hard_rules(features):
            logger.warning(
                "Hard rule triggered - forcing alarm | gas=%s temperature=%s smoke=%s",
                gas_level,
                temperature,
                smoke_level,
            )
            return {
                "alarm": 1,
                "probability": 100.0,
                "status": "Alarm! Hazard Detected!",
                "prediction_label": "hazard",
                "confidence_score": 100.0,
            }

        model, threshold = get_model()
        input_data = pd.DataFrame([features])
        probability = float(model.predict_proba(input_data)[0][1])
        hazard_probability = round(probability * 100, 2)

        # FIX 2: temperature dominance guard.
        # If temperature is high but gas and smoke are both calm,
        # it's likely a hot environment (industrial heat, oven, sunlight on sensor)
        # and not an actual hazard. Override model prediction to safe.
        if temperature > 80 and gas_level < 150 and smoke_level < 100:
            confidence_score = get_label_confidence(probability, "safe")
            logger.warning(
                "High temp with calm gas/smoke - likely environment heat, not hazard | "
                "temp=%s gas=%s smoke=%s hazard_probability=%.2f%% displayed_confidence=%.2f%%",
                temperature,
                gas_level,
                smoke_level,
                hazard_probability,
                confidence_score,
            )
            return {
                "alarm": 0,
                "probability": hazard_probability,
                "status": "Safe - High Temp Environment",
                "prediction_label": "safe",
                "confidence_score": confidence_score,
            }

        prediction = 1 if probability > threshold else 0
        prediction_label = "hazard" if prediction == 1 else "safe"
        confidence_score = get_label_confidence(probability, prediction_label)

        logger.info(
            "Prediction completed label=%s hazard_probability=%s displayed_confidence=%s alarm=%s",
            prediction_label,
            hazard_probability,
            confidence_score,
            prediction,
        )

        return {
            "alarm": prediction,
            "probability": hazard_probability,
            "status": "Alarm! Hazard Detected!" if prediction == 1 else "Safe",
            "prediction_label": prediction_label,
            "confidence_score": confidence_score,
        }

    except Exception:
        logger.exception("Prediction failed")
        raise
