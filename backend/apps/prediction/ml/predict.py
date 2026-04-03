import logging
import os

import joblib
import numpy as np

model_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "model.pkl")
_model = None
logger = logging.getLogger(__name__)


def get_model():
    global _model
    if _model is None:
        logger.info("Loading prediction model from %s", model_path)
        _model = joblib.load(model_path)
        logger.info("Prediction model loaded successfully")
    return _model


def predict(gas_level, temperature, pressure, smoke_level):
    try:
        logger.info(
            "Running prediction for gas=%s temperature=%s pressure=%s smoke=%s",
            gas_level,
            temperature,
            pressure,
            smoke_level,
        )
        model = get_model()

        # Mirror the interaction features used during training.
        temp_gas = temperature * gas_level
        smoke_pressure = smoke_level * pressure

        input_data = np.array(
            [[
                gas_level,
                temperature,
                pressure,
                smoke_level,
                temp_gas,
                smoke_pressure,
            ]]
        )

        prediction = int(model.predict(input_data)[0])
        probability = float(model.predict_proba(input_data)[0][1])
        confidence_score = round(probability * 100, 2)
        prediction_label = "hazard" if prediction == 1 else "safe"

        logger.info(
            "Prediction completed label=%s confidence_score=%s alarm=%s",
            prediction_label,
            confidence_score,
            prediction,
        )
        return {
            "alarm": prediction,
            "probability": confidence_score,
            "status": "Alarm! Hazard Detected!" if prediction == 1 else "Safe",
            "prediction_label": prediction_label,
            "confidence_score": confidence_score,
        }
    except Exception:
        logger.exception("Prediction failed")
        raise
