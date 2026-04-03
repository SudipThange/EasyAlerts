# EasyAlerts Project Status

_Last updated: 2026-04-03_

## Project Overview

EasyAlerts is currently a backend-first Django project built around user authentication, profile management, prediction-data ingestion, prediction-backed history recording, and local ML training/experiment tracking. The frontend folder still exists, but there is no tracked frontend application code in the repository yet.

## New Changes Reflected In This Update

- Added the `history` app to the Django project and main URL configuration.
- Added history data fields for:
  - `prediction_label`
  - `confidence_score`
- Added authenticated history APIs for:
  - creating a history record from sensor readings
  - listing the logged-in user's history
  - admin-only listing of all history records
- Wired history creation to `backend/prediction/ml/predict.py` so prediction values are generated server-side instead of being sent by the client.
- Added logging across the history and prediction flow.
- Switched Django configuration to `.env`-based settings loaded from the project root.
- Added `.env.example` with Django, database, JWT, and MLflow environment settings.
- Added Swagger / OpenAPI documentation with `drf-spectacular`.
- Added API schema and Swagger UI routes:
  - `/api/schema/`
  - `/api/docs/swagger/`
- Updated MLflow launch behavior to work with the backend-level virtual environment.
- Updated ignore rules for `backend/.venv/`, `__pycache__/`, and Python bytecode files.

## What Has Been Done

### 1. Project Setup

- Initialized the Git repository.
- Added `.gitignore`.
- Created `backend/` and `frontend/` directories.
- Set up the Django project in `backend/`.

### 2. Backend Configuration

- Configured Django 5 project settings and app wiring.
- Added these installed apps:
  - `rest_framework`
  - `rest_framework_simplejwt.token_blacklist`
  - `corsheaders`
  - `drf_spectacular`
  - `easyalerts`
  - `user_profile`
  - `prediction`
  - `history`
- Configured a custom user model with:
  - email-based login
  - role support (`admin`, `user`)
  - phone number validation and normalization
  - automatic admin and staff flag synchronization
- Added JWT authentication using SimpleJWT.
- Added `.env`-based configuration for:
  - Django secret key
  - debug mode
  - allowed hosts
  - CORS / CSRF settings
  - JWT lifetimes
  - database settings
  - MLflow paths
  - log level
- Added database support for:
  - SQL Server as the default backend
  - SQLite fallback via `EASYALERTS_DB_BACKEND=sqlite`
- Added application logging to console and file output.

### 3. User Management API

The `user_profile` app currently includes:

- custom `UserProfile` model and manager
- registration serializer with:
  - email normalization
  - Indian phone number normalization and validation
  - duplicate phone checks
  - password confirmation
  - password validation
- login serializer with:
  - email/password authentication
  - JWT access and refresh token generation
  - dynamic token-expiry metadata in the response
- logout serializer with refresh-token blacklisting
- profile edit serializer with:
  - phone update support
  - optional password change
  - forced re-authentication support after password updates
- read-only user/profile serializer

Available user/auth endpoints under `/users/`:

- `register/`
- `login/`
- `token/refresh/`
- `token/verify/`
- `logout/`
- `edit-profile/`
- `profile/`
- `list/`

### 4. History App And Prediction-Backed Record Flow

The `history` app now includes:

- `History` model with:
  - `user`
  - `timestamp`
  - `gas_level`
  - `temperature`
  - `pressure`
  - `smoke_level`
  - `prediction_label`
  - `confidence_score`
- serializer support for creating history from sensor inputs only
- read serializer support for returning prediction results with each record
- logging for validation, persistence, and fetch operations

Available history endpoints under `/users/history/`:

- `GET /users/history/`
- `POST /users/history/`
- `GET /users/history/admin/`

Current history creation flow:

- client sends sensor readings
- backend validates the payload
- backend calls `backend/prediction/ml/predict.py`
- model inference generates:
  - `prediction_label`
  - `confidence_score`
- backend saves the history row with those generated values

### 5. Prediction App Foundation

The `prediction` app currently includes:

- `RawData` model with:
  - `timestamp`
  - `gas_level`
  - `temperature`
  - `pressure`
  - `smoke_level`
  - `alarm`
- initial migration for prediction data
- dataset file at `backend/resources/data/raw_data.csv`
- management command `load_data` to import the CSV into the database
- local runtime prediction helper at `backend/prediction/ml/predict.py`

Current dataset status:

- `raw_data.csv` is present
- file contains 4001 lines including the header

### 6. ML Training And Experiment Tracking

Committed ML work exists in `backend/prediction/ml/train.py` and includes:

- loading prediction data from the Django database
- feature preparation and feature interaction generation
- train/test split with stratification
- XGBoost classifier training
- probability calibration with `CalibratedClassifierCV`
- evaluation using F1 score, ROC AUC, classification report, and confusion matrix
- feature importance logging
- model persistence with `joblib`
- MLflow experiment logging

Related ML assets and tooling include:

- trained model artifact at `backend/prediction/ml/model.pkl`
- MLflow run artifacts under `backend/mlruns/`
- `backend/start_mlflow_ui.ps1`
- MLflow path configuration from `.env`

### 7. API Documentation

Swagger / OpenAPI documentation is now integrated using `drf-spectacular`.

Available documentation routes:

- `/api/schema/`
- `/api/docs/swagger/`

Current documentation coverage includes:

- authentication endpoints
- user profile endpoints
- user list endpoint
- history endpoints

### 8. CI, Environment, And Testing

- Added GitHub Actions workflow at `.github/workflows/ci.yml`
- CI currently:
  - checks out the repository
  - sets up Python 3.11
  - installs dependencies from `backend/requirements.txt`
  - runs `python manage.py check` from the `backend/` directory
- `backend/requirements.txt` includes Django, REST, SQL Server, ML, MLflow, and Swagger dependencies
- `pywin32` remains commented out for CI compatibility
- the project now uses a backend-level virtual environment at `backend/.venv/`

Automated test coverage currently exists for:

- `user_profile`
- `history`

Covered test areas include:

- registration email and phone normalization
- duplicate phone handling
- login token-expiry response
- logout token blacklisting
- password-change token blacklisting
- invalid pagination handling
- admin role and staff flag synchronization
- admin-only access protection
- history serializer input validation
- history prediction-field population from the prediction module
- history list serialization

## Verification Completed

The following were verified locally on 2026-04-03 with the backend virtual environment:

- `backend\\.venv\\Scripts\\python.exe backend\\manage.py check`
- `backend\\.venv\\Scripts\\python.exe backend\\manage.py spectacular --file backend\\openapi-schema.yaml`
- `backend\\.venv\\Scripts\\mlflow.exe --version`

Result:

- Django system check passed
- OpenAPI schema generation passed
- MLflow launcher works from the backend virtual environment

## Verification Gaps / Current Issue

One current issue showed up during local verification on 2026-04-03:

- `history` tests currently fail under SQLite because the `History` model now uses `db_table = "user_history"` while the existing `history` migration still creates `sensor_history`
- there is no follow-up migration yet to align the database table name with the current model definition

Practical impact:

- the app code and API structure are in place
- the history model/migration state is currently out of sync and needs a corrective migration before SQLite-based history tests will pass again

## Recent Commit History

1. `2026-04-03` - `ML Model Deployment.`
2. `2026-04-02` - `fix: removed pywin32 for CI compatibility`
3. `2026-04-02` - `Updated Backend`
4. `2026-04-02` - `Git-Actions Solved`
5. `2026-04-02` - `User, Prediction feature is added.`
6. `2026-04-02` - `New features added: user,prediction`
7. `2026-04-01` - `Fixed CI - added requirements.txt`
8. `2026-04-01` - `Added API changes and updated user_profile app`
9. `2026-04-01` - `Added GitHub Actions CI`
10. `2026-04-01` - `Added backend and frontend Files`

## Current Project State

### Completed / Working

- Django backend project structure
- custom user model and authentication flow
- JWT login, refresh, verify, and logout flow
- user profile view and edit APIs
- admin-only user listing
- history API routes and view flow
- server-side prediction-backed history creation
- prediction data model
- CSV import command for raw data
- committed ML training pipeline
- committed local trained model artifact
- MLflow experiment logging setup
- backend logging configuration
- `.env`-based configuration
- Swagger / OpenAPI documentation
- backend virtual environment tooling alignment
- CI Django check workflow
- `user_profile` automated tests

### In Progress / Partial

- prediction API endpoints are still not exposed as a dedicated REST API
- `backend/prediction/views.py` is still a placeholder
- `backend/prediction/tests.py` is still a placeholder
- frontend application code is not yet present in tracked files
- CI currently runs Django checks only and does not run the test suite
- history model and migration table names are currently inconsistent

### Things To Improve Next

- add a corrective migration for the `history` table name mismatch
- add dedicated prediction serializers, views, URLs, and API endpoints
- load and serve the trained model through a prediction API if needed
- add end-to-end tests that exercise live user and history endpoints
- extend CI to run tests in addition to `manage.py check`
- decide whether large MLflow artifacts should remain committed to the repository
- separate development-only ML dependencies from runtime backend requirements if needed
- add frontend implementation
- add project documentation for setup, backend venv usage, environment variables, API usage, and deployment

## Summary

The project has moved beyond the earlier authentication-and-data-ingestion-only stage. It now includes a history app, server-side prediction-backed history creation, `.env`-based configuration, Swagger API documentation, and backend-virtualenv-aware tooling. The main remaining backend issue is the current history model/migration mismatch, and the next larger phase is still to expose prediction as a dedicated API/service and build frontend functionality on top of the backend.
