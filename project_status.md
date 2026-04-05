# EasyAlerts Project Status

_Last updated: 2026-04-03_

## Project Overview

EasyAlerts is now a full-stack hazard-detection project with:

- a Django backend for authentication, history storage, ML-backed hazard prediction, and API documentation
- a React/Vite frontend with a light-themed landing page, login flow, detection form, history page, and shared footer
- an ML workflow for training and serving hazard predictions from sensor readings

The product context is hazard detection from sensor input, not stock-market hazard detection.

## New Changes Reflected In This Update

- Refactored backend app layout so Django apps now live under `backend/apps/`
- Moved these apps into the new package structure:
  - `apps.user_profile`
  - `apps.prediction`
  - `apps.history`
- Updated Django settings, URL includes, app configs, and cross-app imports to match the new package paths
- Added `backend/apps/__init__.py`
- Added a corrective migration to align the `History` model table name with the migration state:
  - `backend/apps/history/migrations/0002_alter_history_table.py`
- Verified backend checks and tests successfully after the refactor
- Implemented the tracked frontend application under `frontend/`
- Switched the frontend to a light theme
- Reworked the landing page so “How to Use” now appears below the fold on the same page instead of as a separate user-facing page
- Added a global footer to the frontend
- Corrected the frontend copy and flows so they match the real product:
  - hazard detection from sensor readings
  - not stock/market hazard detection
- Updated frontend login to use the Django backend’s `/users/login/` endpoint
- Updated frontend hazard detection to submit sensor data to `/users/history/`
- Updated frontend history view to display stored sensor-reading hazard results from `/users/history/`

## What Has Been Done

### 1. Project Setup

- Initialized the Git repository
- Added `.gitignore`
- Created `backend/` and `frontend/`
- Set up the Django project in `backend/`
- Set up the React/Vite frontend in `frontend/`

### 2. Backend Configuration

- Configured Django 5 project settings and app wiring
- Current installed project apps include:
  - `easyalerts`
  - `apps.user_profile`
  - `apps.prediction`
  - `apps.history`
- Added these supporting Django/REST packages:
  - `rest_framework`
  - `rest_framework_simplejwt.token_blacklist`
  - `corsheaders`
  - `drf_spectacular`
- Configured a custom user model with:
  - email-based login
  - role support (`admin`, `user`)
  - phone number validation and normalization
  - automatic admin/staff synchronization
- Added JWT authentication using SimpleJWT
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
- Added application logging to console and file output

### 3. User Management API

The `apps.user_profile` app currently includes:

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
  - token-expiry metadata in the response
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

### 4. History App And Hazard Detection Flow

The `apps.history` app includes:

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
- read serializer support for returning stored prediction values with each record
- logging for validation, persistence, and fetch operations

Available history endpoints under `/users/history/`:

- `GET /users/history/`
- `POST /users/history/`
- `GET /users/history/admin/`

Current history creation flow:

- client sends sensor readings
- backend validates the payload
- backend calls `backend/apps/prediction/ml/predict.py`
- model inference generates:
  - `prediction_label`
  - `confidence_score`
- backend saves the history row with those generated values

### 5. Prediction App Foundation

The `apps.prediction` app currently includes:

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
- local runtime prediction helper at `backend/apps/prediction/ml/predict.py`

Current dataset status:

- `raw_data.csv` is present
- file contains 4001 lines including the header

### 6. ML Training And Experiment Tracking

Committed ML work exists in `backend/apps/prediction/ml/train.py` and includes:

- loading prediction data from the Django database
- feature preparation and feature interaction generation
- train/test split with stratification
- XGBoost classifier training
- probability calibration with `CalibratedClassifierCV`
- evaluation using F1 score, ROC AUC, classification report, and confusion matrix
- feature-importance logging
- model persistence with `joblib`
- MLflow experiment logging

Related ML assets and tooling include:

- trained model artifact at `backend/apps/prediction/ml/model.pkl`
- MLflow run artifacts under `backend/mlruns/`
- `backend/start_mlflow_ui.ps1`
- MLflow path configuration from `.env`

### 7. API Documentation

Swagger / OpenAPI documentation is integrated using `drf-spectacular`.

Available documentation routes:

- `/api/schema/`
- `/api/docs/swagger/`

Current documentation coverage includes:

- authentication endpoints
- user profile endpoints
- user list endpoint
- history endpoints

### 8. Frontend Application

The frontend now exists and is actively wired into the backend.

Current frontend areas include:

- light-themed landing page
- in-page “How to Use” section below the fold
- top navigation
- footer
- login page
- protected hazard-detection page
- protected history page

Current frontend behavior includes:

- `/` shows the landing page and the in-page “How to Use” section
- `/how-to-use` redirects to `/#how-it-works`
- `/login` uses the Django backend login endpoint
- `/detect` submits sensor readings to the backend history endpoint
- `/history` fetches stored hazard-detection history from the backend

Frontend tech stack:

- React
- React Router
- Vite
- Tailwind CSS
- Axios

### 9. CI, Environment, And Testing

- Added GitHub Actions workflow at `.github/workflows/ci.yml`
- CI currently:
  - checks out the repository
  - sets up Python 3.11
  - installs dependencies from `backend/requirements.txt`
  - runs `python manage.py check` from the `backend/` directory
- `backend/requirements.txt` includes Django, REST, SQL Server, ML, MLflow, and Swagger dependencies
- `pywin32` remains commented out for CI compatibility
- the project uses a backend-level virtual environment at `backend/.venv/`

Automated backend test coverage currently exists for:

- `apps.user_profile`
- `apps.history`

Covered test areas include:

- registration email and phone normalization
- duplicate phone handling
- login token-expiry response
- logout token blacklisting
- password-change token blacklisting
- invalid pagination handling
- admin role and staff-flag synchronization
- admin-only access protection
- history serializer input validation
- history prediction-field population from the prediction module
- history list serialization

## Verification Completed

The following were verified locally on 2026-04-03:

Backend:

- `backend\\.venv\\Scripts\\python.exe -B manage.py check`
- `backend\\.venv\\Scripts\\python.exe -B manage.py test`

Frontend:

- `npm run build`

Result:

- Django system check passed
- backend test suite passed
- frontend production build passed

## Current Project State

### Completed / Working

- Django backend project structure
- backend app refactor into `backend/apps/`
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
- backend virtual-environment tooling alignment
- CI Django check workflow
- backend automated tests for user and history flows
- tracked frontend application
- light-theme frontend landing page
- in-page “How to Use” scroll section
- shared frontend footer
- frontend detection flow aligned with backend sensor inputs
- frontend history view aligned with backend history payloads

### In Progress / Partial

- prediction functionality is still exposed indirectly through history creation rather than through a dedicated prediction API
- `backend/apps/prediction/views.py` is still a placeholder
- `backend/apps/prediction/tests.py` is still a placeholder
- frontend registration page is not yet implemented even though the backend registration API exists
- frontend route coverage is still narrower than backend route coverage
- CI currently runs Django checks only and does not run the backend test suite or frontend build

### Things To Improve Next

- add a dedicated frontend registration page wired to `/users/register/`
- add frontend profile and logout API integration beyond local token removal
- add dedicated prediction serializers, views, URLs, and API endpoints if direct prediction access is needed
- add prediction-app tests
- extend CI to run backend tests and frontend build checks
- add end-to-end tests that cover login, detection, and history flows
- decide whether large MLflow artifacts should remain committed to the repository
- separate development-only ML dependencies from runtime backend requirements if needed
- add clearer setup and deployment documentation for backend, frontend, environment variables, and API usage

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

## Summary

EasyAlerts is no longer just a backend-first scaffold. It now has a refactored Django backend under `backend/apps/`, working history-backed hazard detection from sensor readings, backend tests that pass locally, and a light-themed React frontend that is wired to the real backend authentication and history flows. The main next steps are filling out the remaining frontend user flows, deciding whether to expose prediction as a separate API, and strengthening CI/test coverage across the full stack.
