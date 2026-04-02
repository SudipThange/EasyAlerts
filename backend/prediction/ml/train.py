import os
import logging
from pathlib import Path
import joblib
import pandas as pd
import mlflow
import mlflow.xgboost

from xgboost import XGBClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import f1_score, roc_auc_score, classification_report, confusion_matrix
from sklearn.calibration import CalibratedClassifierCV

from prediction.models import RawData


BASE_DIR = Path(__file__).resolve().parents[2]
MLFLOW_DB_PATH = BASE_DIR / "mlflow.db"
MLFLOW_ARTIFACTS_DIR = BASE_DIR / "mlruns"


# Logging setup.
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)


def configure_mlflow():
    MLFLOW_ARTIFACTS_DIR.mkdir(exist_ok=True)
    tracking_uri = f"sqlite:///{MLFLOW_DB_PATH.as_posix()}"
    mlflow.set_tracking_uri(tracking_uri)
    logging.info("MLflow tracking URI: %s", tracking_uri)


# Load data.
def load_data():
    logging.info("📦 Fetching data from DB...")
    
    queryset = RawData.objects.all().values(
        "gas_level", "temperature", "pressure", "smoke_level", "alarm"
    )
    
    df = pd.DataFrame(list(queryset))
    
    logging.info(f"✅ Total rows loaded: {len(df)}")
    return df


# Prepare data.
def prepare_data(df):
    X = df[["gas_level", "temperature", "pressure", "smoke_level"]]
    y = df["alarm"]

    logging.info(f"🚨 Alarm=1: {y.sum()} | Safe=0: {(y==0).sum()}")
    
    return X, y


# Feature engineering.
def add_feature_interaction(X):
    X = X.copy()
    X["temp_gas"] = X["temperature"] * X["gas_level"]
    X["smoke_pressure"] = X["smoke_level"] * X["pressure"]
    return X


# Split data.
def split_data(X, y):
    X_train, X_test, y_train, y_test = train_test_split(
        X, y,
        test_size=0.2,
        random_state=42,
        stratify=y
    )
    
    logging.info(f"📊 Train: {len(X_train)} | Test: {len(X_test)}")
    
    return X_train, X_test, y_train, y_test


# Train model with calibration.
def train_model(X_train, y_train):
    logging.info("🤖 Training XGBoost with calibration...")

    base_model = XGBClassifier(
        scale_pos_weight=7,
        max_depth=3,
        n_estimators=150,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        reg_alpha=1,
        reg_lambda=2,
        eval_metric="aucpr",
        random_state=42,
    )

    base_model.fit(X_train, y_train)

    model = CalibratedClassifierCV(base_model, method="sigmoid", cv=3)
    model.fit(X_train, y_train)

    logging.info("✅ Training complete with calibration!")
    return model


# Evaluate model.
def evaluate_model(model, X_test, y_test, threshold=0.3):
    y_proba = model.predict_proba(X_test)[:, 1]
    y_pred  = (y_proba > threshold).astype(int)

    f1  = f1_score(y_test, y_pred)
    auc = roc_auc_score(y_test, y_proba)

    logging.info(f"📈 F1 Score: {f1:.4f}")
    logging.info(f"📈 AUC Score: {auc:.4f}")

    report = classification_report(y_test, y_pred)
    logging.info("\n" + report)

    cm = confusion_matrix(y_test, y_pred)

    logging.info("📊 Confusion Matrix:")
    logging.info(f"TN: {cm[0][0]}  FP: {cm[0][1]}")
    logging.info(f"FN: {cm[1][0]}  TP: {cm[1][1]}")

    print("\nConfusion Matrix:")
    print(cm)

    # 🔥 DEBUG MISSED CASES (FN)
    fn_indices = (y_test == 1) & (y_pred == 0)

    if fn_indices.sum() > 0:
        print("\n🚨 MISSED CASE(S):")
        print(X_test[fn_indices])

        print("\n🔍 Probabilities of missed cases:")
        print(y_proba[fn_indices])
    else:
        print("\n✅ No missed cases (FN = 0)")

    return f1, auc, report, cm


# Feature importance.
def log_feature_importance(model, feature_names):
    logging.info("🔍 Feature Importance:")

    try:
        base_model = model.calibrated_classifiers_[0].estimator

        for feature, score in zip(feature_names, base_model.feature_importances_):
            logging.info(f"{feature:<20} → {score:.4f}")

    except Exception as e:
        logging.warning(f"⚠️ Could not fetch feature importance: {e}")


# Save model.
def save_model(model):
    model_path = os.path.join(os.path.dirname(__file__), "model.pkl")
    joblib.dump(model, model_path)
    
    logging.info(f"💾 Model saved at: {model_path}")
    return model_path


# MLflow logging.
def log_mlflow(model, f1, auc):
    configure_mlflow()
    mlflow.set_experiment("fire_detection")
    logging.info("MLflow artifact directory: %s", MLFLOW_ARTIFACTS_DIR)

    with mlflow.start_run():
        mlflow.log_metric("f1_score", f1)
        mlflow.log_metric("auc_score", auc)

        mlflow.sklearn.log_model(model, "model")

        logging.info("📊 MLflow logging complete")


# Training pipeline.
def train_pipeline():
    df = load_data()

    X, y = prepare_data(df)

    # Feature engineering.
    X = add_feature_interaction(X)

    # Split data.
    X_train, X_test, y_train, y_test = split_data(X, y)

    # Train model.
    model = train_model(X_train, y_train)

    # Evaluate model.
    f1, auc, report, cm = evaluate_model(model, X_test, y_test, threshold=0.3)

    # Feature importance.
    log_feature_importance(model, X.columns)

    # Save model.
    save_model(model)

    # MLflow logging.
    log_mlflow(model, f1, auc)


# Run pipeline.
if __name__ == "__main__":
    train_pipeline()
