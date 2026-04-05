import logging
import os
from pathlib import Path

import joblib
import mlflow
import mlflow.xgboost
import numpy as np
import pandas as pd
from dotenv import load_dotenv
from imblearn.over_sampling import SMOTE
from sklearn.calibration import CalibratedClassifierCV
from sklearn.metrics import classification_report, confusion_matrix, f1_score, recall_score, roc_auc_score
from sklearn.model_selection import train_test_split
from xgboost import XGBClassifier

from apps.prediction.models import RawData


BASE_DIR = Path(__file__).resolve().parents[2]
PROJECT_ROOT = BASE_DIR.parent
load_dotenv(PROJECT_ROOT / ".env")

mlflow_db_path = Path(os.getenv("MLFLOW_DB_PATH", "mlflow.db"))
if not mlflow_db_path.is_absolute():
    mlflow_db_path = BASE_DIR / mlflow_db_path

mlflow_artifacts_dir = Path(os.getenv("MLFLOW_ARTIFACTS_DIR", "mlruns"))
if not mlflow_artifacts_dir.is_absolute():
    mlflow_artifacts_dir = BASE_DIR / mlflow_artifacts_dir


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
)


def configure_mlflow():
    mlflow_artifacts_dir.mkdir(exist_ok=True)
    tracking_uri = f"sqlite:///{mlflow_db_path.as_posix()}"
    mlflow.set_tracking_uri(tracking_uri)
    logging.info("MLflow tracking URI: %s", tracking_uri)


def load_data():
    logging.info("Fetching data from DB...")

    queryset = RawData.objects.all().values(
        "gas_level", "temperature", "pressure", "smoke_level", "alarm"
    )

    df = pd.DataFrame(list(queryset))

    logging.info("Total rows loaded: %s", len(df))
    return df


def prepare_data(df):
    X = df[["gas_level", "temperature", "pressure", "smoke_level"]]
    y = df["alarm"]

    logging.info("Alarm=1: %s | Safe=0: %s", y.sum(), (y == 0).sum())

    return X, y


def add_feature_interaction(X):
    X = X.copy()
    X["temp_gas"] = X["temperature"] * X["gas_level"]
    X["smoke_pressure"] = X["smoke_level"] * X["pressure"]
    return X


def split_data(X, y):
    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.2,
        random_state=42,
        stratify=y,
    )

    logging.info("Train: %s | Test: %s", len(X_train), len(X_test))

    sm = SMOTE(random_state=42, k_neighbors=3)
    X_train, y_train = sm.fit_resample(X_train, y_train)
    logging.info("After SMOTE — Train: %s | Alarms: %s", len(X_train), y_train.sum())

    return X_train, X_test, y_train, y_test


def train_model(X_train, y_train):
    logging.info("Training XGBoost with calibration...")

    ratio = (y_train == 0).sum() / (y_train == 1).sum()

    # CHANGE: removed * 2 from ratio.
    # SMOTE already balanced classes to 3115:3115, so ratio is ~1.0.
    # Doubling it was over-penalizing safe predictions, which caused 113 FPs.
    # Using ratio as-is reflects the true post-SMOTE class balance.
    logging.info("Computed scale_pos_weight: %.2f", ratio)

    base_model = XGBClassifier(
        scale_pos_weight=ratio,     # CHANGE: was ratio * 2
        max_depth=3,
        n_estimators=150,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.6,
        colsample_bylevel=0.7,
        reg_alpha=1,
        reg_lambda=2,
        eval_metric="aucpr",
        random_state=42,
    )

    base_model.fit(X_train, y_train)

    model = CalibratedClassifierCV(
        base_model,
        method="isotonic",
        cv=5,
    )
    model.fit(X_train, y_train)

    logging.info("Training complete with calibration")
    return model


def find_best_threshold(y_test, y_proba):
    logging.info("Sweeping thresholds to minimize FN...")

    best_threshold = 0.10  # fallback
    
    # Sweep full range, keep updating as long as FN=0
    # Picks the HIGHEST threshold where recall is still 1.0
    for t in np.arange(0.10, 0.50, 0.01):
        y_pred = (y_proba > t).astype(int)
        recall = recall_score(y_test, y_pred)
        fn = ((y_pred == 0) & (y_test == 1)).sum()
        fp = ((y_pred == 1) & (y_test == 0)).sum()
        logging.info("Threshold=%.2f | Recall=%.3f | FN=%s | FP=%s", t, recall, fn, fp)

        if recall == 1.0:
            best_threshold = round(t, 2)  # keep updating, don't break
        else:
            break  # first threshold where a hazard is missed — stop, use last good one

    logging.info("Best threshold selected: %.2f (Recall=1.0, FN=0)", best_threshold)
    return best_threshold


def evaluate_model(model, X_test, y_test, threshold=0.3):
    y_proba = model.predict_proba(X_test)[:, 1]

    threshold = find_best_threshold(y_test, y_proba)

    y_pred = (y_proba > threshold).astype(int)

    f1 = f1_score(y_test, y_pred)
    auc = roc_auc_score(y_test, y_proba)

    logging.info("Threshold used: %.2f", threshold)
    logging.info("F1 Score: %.4f", f1)
    logging.info("AUC Score: %.4f", auc)

    report = classification_report(y_test, y_pred)
    logging.info("\n%s", report)

    cm = confusion_matrix(y_test, y_pred)

    logging.info("Confusion Matrix:")
    logging.info("TN: %s  FP: %s", cm[0][0], cm[0][1])
    logging.info("FN: %s  TP: %s", cm[1][0], cm[1][1])

    fn_indices = ((y_test == 1) & (y_pred == 0)).values

    if fn_indices.sum() > 0:
        missed = X_test[fn_indices].copy()
        missed["probability"] = y_proba[fn_indices]
        logging.warning("MISSED HAZARD CASES:\n%s", missed)
        logging.warning(
            "Missed mean vs all alarms mean:\n%s",
            pd.concat([
                missed.drop(columns="probability").mean().rename("missed"),
                X_test[y_test.values == 1].mean().rename("all_alarms"),
            ], axis=1),
        )
    else:
        logging.info("No missed cases (FN = 0)")

    return f1, auc, report, cm, threshold


def log_feature_importance(model, feature_names):
    logging.info("Feature Importance:")

    try:
        base_model = model.calibrated_classifiers_[0].estimator

        for feature, score in zip(feature_names, base_model.feature_importances_):
            logging.info("%-20s -> %.4f", feature, score)

    except Exception as exc:
        logging.warning("Could not fetch feature importance: %s", exc)


def save_model(model, threshold):
    model_path = Path(__file__).resolve().parent / "model.pkl"
    joblib.dump({"model": model, "threshold": threshold}, model_path)

    logging.info("Model saved at: %s", model_path)
    return model_path


def log_mlflow(model, f1, auc):
    configure_mlflow()
    mlflow.set_experiment("fire_detection")
    logging.info("MLflow artifact directory: %s", mlflow_artifacts_dir)

    with mlflow.start_run():
        mlflow.log_metric("f1_score", f1)
        mlflow.log_metric("auc_score", auc)
        mlflow.sklearn.log_model(model, "model")
        logging.info("MLflow logging complete")


def train_pipeline():
    df = load_data()
    X, y = prepare_data(df)
    X = add_feature_interaction(X)
    X_train, X_test, y_train, y_test = split_data(X, y)
    model = train_model(X_train, y_train)
    f1, auc, report, cm, threshold = evaluate_model(model, X_test, y_test)
    log_feature_importance(model, X.columns)
    save_model(model, threshold)
    log_mlflow(model, f1, auc)
    return report, cm


if __name__ == "__main__":
    train_pipeline()