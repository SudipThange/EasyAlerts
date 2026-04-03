# EasyAlerts Project Status

_Last updated: 2026-04-02_

## Project Overview

EasyAlerts is currently a backend-first Django project focused on user authentication, profile management, prediction-data ingestion, and a local ML training workflow for fire or hazard alert use cases. The frontend folder exists locally, but there is still no tracked frontend application code in the repository.

## New Changes Reflected In This Update

- Added committed ML training code under `backend/prediction/ml/`.
- Added committed ML model artifact at `backend/prediction/ml/model.pkl`.
- Added MLflow tracking outputs under `backend/mlruns/` and tracking database usage in the training flow.
- Added Django logging configuration with file output to `backend/logs/app.log`.
- Added `backend/start_mlflow_ui.ps1` for local MLflow UI startup.
- Expanded `backend/requirements.txt` to include ML, MLflow, and related backend dependencies.
- Updated GitHub Actions CI to install dependencies from `backend/requirements.txt` and run Django checks from the `backend/` directory.
- Removed `pywin32` from active installation in `backend/requirements.txt` for CI compatibility.

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
  - `easyalerts`
  - `user_profile`
  - `prediction`
- Configured a custom user model with:
  - email-based login
  - role support (`admin`, `user`)
  - phone number validation and normalization
  - automatic admin and staff flag synchronization
- Added JWT authentication using SimpleJWT.
- Added database support for:
  - SQL Server as the default backend
  - SQLite fallback via `EASYALERTS_DB_BACKEND=sqlite`
- Added application logging to console and file output.

### 3. User Management API

The `user_profile` app is implemented with:

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

### 4. User API Endpoints

The following endpoints are available under `/users/`:

- `register/`
- `login/`
- `token/refresh/`
- `token/verify/`
- `logout/`
- `edit-profile/`
- `profile/`
- `list/`

Implemented views cover:

- user registration
- user login
- user logout
- authenticated profile retrieval
- authenticated profile editing
- admin-only user listing with pagination validation

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

Current dataset status:

- `raw_data.csv` is present
- file contains 4001 lines including the header

### 6. ML Training And Experiment Tracking

Committed ML work now exists in `backend/prediction/ml/train.py` and includes:

- loading prediction data from the Django database
- feature preparation and feature interaction generation
- train/test split with stratification
- XGBoost classifier training
- probability calibration with `CalibratedClassifierCV`
- evaluation using F1 score, ROC AUC, classification report, and confusion matrix
- feature importance logging
- model persistence with `joblib`
- MLflow experiment logging

Related committed assets now include:

- trained model artifact at `backend/prediction/ml/model.pkl`
- MLflow run artifacts under `backend/mlruns/`
- local MLflow startup helper script at `backend/start_mlflow_ui.ps1`

### 7. CI And Testing

- Added GitHub Actions workflow at `.github/workflows/ci.yml`
- CI currently:
  - checks out the repository
  - sets up Python 3.11
  - installs dependencies from `backend/requirements.txt`
  - runs `python manage.py check` from the `backend/` directory
- `backend/requirements.txt` now includes Django, REST, SQL Server, ML, MLflow, and training-related packages
- `pywin32` is commented out to avoid Ubuntu CI install issues

Automated tests currently exist for the `user_profile` app.

Covered test areas:

- registration email and phone normalization
- duplicate phone handling
- login token-expiry response
- logout token blacklisting
- password-change token blacklisting
- invalid pagination handling
- admin role and staff flag synchronization
- admin-only access protection

## Verification Completed

The following were verified locally on 2026-04-02 using SQLite:

- `python -B manage.py check`
- `python manage.py test user_profile`

Result:

- Django system check passed
- 8 `user_profile` tests passed

## Recent Commit History

1. `2026-04-02` - `fix: removed pywin32 for CI compatibility`
2. `2026-04-02` - `Updated Backend`
3. `2026-04-02` - `Git-Actions Solved`
4. `2026-04-02` - `User, Prediction feature is added.`
5. `2026-04-02` - `New features added: user,prediction`
6. `2026-04-01` - `Fixed CI - added requirements.txt`
7. `2026-04-01` - `Added API changes and updated user_profile app`
8. `2026-04-01` - `Added GitHub Actions CI`
9. `2026-04-01` - `Added backend and frontend Files`
10. `2026-04-01` - `GitIngonre File Uploaded`

## Current Project State

### Completed / Working

- Django backend project structure
- custom user model and authentication flow
- JWT login, refresh, verify, and logout flow
- user profile view and edit APIs
- admin-only user listing
- prediction data model
- CSV import command for raw data
- committed ML training pipeline
- committed local trained model artifact
- MLflow experiment logging setup
- backend logging configuration
- CI Django check workflow
- `user_profile` automated tests

### In Progress / Partial

- prediction API endpoints are not implemented yet
- `backend/prediction/views.py` is still a placeholder
- `backend/prediction/tests.py` is still a placeholder
- prediction routes are not yet exposed in the main URL configuration
- frontend application code is not yet present in tracked files
- CI currently runs Django checks only and does not run the test suite

### Things To Improve Next

- add prediction serializers, views, URLs, and API endpoints
- load and serve the trained model for inference
- add prediction tests and end-to-end API coverage
- decide whether large MLflow artifacts should remain committed to the repository
- separate development-only ML dependencies from runtime backend requirements if needed
- add frontend implementation
- document setup, environment variables, database selection, and ML workflow usage

## Summary

The project now has a stronger backend foundation than the previous status file reflected. Authentication and profile management are in place, prediction data ingestion exists, and the ML training workflow is now committed with model and MLflow artifacts. The next major step is turning the prediction module into a usable API and deciding how the trained-model workflow should be exposed and maintained in the application.
