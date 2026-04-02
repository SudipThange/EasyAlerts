# EasyAlerts Project Status

_Last updated: 2026-04-02_

## Project Overview

EasyAlerts is currently set up as a Django-based backend project with a placeholder frontend folder. The main completed work so far is the custom user management and authentication API, along with the initial prediction/data-ingestion foundation for fire or hazard alert data.

## What Has Been Done

### 1. Project Initialization

- Initialized the Git repository and basic project structure.
- Added `.gitignore`.
- Created separate `backend/` and `frontend/` directories.
- Set up the Django project under `backend/easyalerts/`.

### 2. Backend Setup

- Created the Django project configuration and app wiring.
- Added these installed apps:
  - `rest_framework`
  - `rest_framework_simplejwt.token_blacklist`
  - `corsheaders`
  - `user_profile`
  - `prediction`
- Configured custom user model with:
  - email-based login
  - role support (`admin`, `user`)
  - phone number validation
  - automatic staff/admin synchronization
- Added JWT authentication using SimpleJWT.
- Added database configuration for:
  - SQL Server as the default backend
  - SQLite fallback using `EASYALERTS_DB_BACKEND=sqlite`

### 3. User Management API

Implemented the `user_profile` app with:

- Custom `UserProfile` model
- Custom `UserProfileManager`
- Registration serializer with:
  - email normalization
  - Indian phone number normalization/validation
  - duplicate checks
  - password confirmation
  - password-strength validation
- Login serializer with:
  - email/password authentication
  - JWT access and refresh token generation
  - token expiry metadata in response
- Logout serializer with refresh token blacklisting
- Profile edit serializer with:
  - phone update support
  - optional password change
  - forced token invalidation when password changes
- Read-only user/profile serializer

### 4. User API Endpoints

These endpoints are currently available under `/users/`:

- `register/`
- `login/`
- `token/refresh/`
- `token/verify/`
- `logout/`
- `edit-profile/`
- `profile/`
- `list/`

Implemented views for:

- user registration
- user login
- user logout
- authenticated profile view
- authenticated profile edit
- admin-only user listing with pagination

### 5. Prediction App Foundation

The `prediction` app has been created and includes:

- `RawData` model with fields:
  - `timestamp`
  - `gas_level`
  - `temperature`
  - `pressure`
  - `smoke_level`
  - `alarm`
- Initial migration for the prediction data model
- Raw dataset at `backend/resources/data/raw_data.csv`
- Django management command `load_data` to import CSV data into the database

Current dataset status:

- `raw_data.csv` is present
- file contains 4001 lines total, including the header

### 6. ML Training Work

There is local ML pipeline work in progress under `backend/prediction/ml/train.py` that includes:

- loading prediction data from the database
- preparing features/labels
- train/test split
- XGBoost classifier training
- evaluation with F1 and AUC
- feature importance logging
- model saving with `joblib`
- MLflow logging

Note:

- `backend/prediction/ml/` is currently an untracked local folder in the workspace, so this part appears to be started but not committed yet.

### 7. Testing and CI

- Added GitHub Actions CI workflow at `.github/workflows/ci.yml`
- CI currently installs dependencies from `requirements.txt`
- CI runs `python backend/manage.py check`
- Added automated tests for `user_profile`

Covered test areas:

- registration normalization
- duplicate phone handling
- login token expiry response
- logout token blacklisting
- password-change token blacklisting
- invalid pagination handling
- admin role/staff sync
- admin-only access protection

## Verification Completed

The following were verified locally on 2026-04-02 using SQLite:

- `python manage.py check`
- `python manage.py test user_profile`

Result:

- Django system check passed
- 8 `user_profile` tests passed

## Commit History So Far

1. `2026-04-01` - `Init Project`
2. `2026-04-01` - `GitIngonre File Uploaded`
3. `2026-04-01` - `Added backend and frontend Files`
4. `2026-04-01` - `Added GitHub Actions CI`
5. `2026-04-01` - `Added API changes and updated user_profile app`
6. `2026-04-01` - `Fixed CI - added requirements.txt`
7. `2026-04-02` - `New features added: user,prediction`

## Current Project State

### Completed / Working

- Django backend project structure
- custom user model
- JWT authentication flow
- profile management APIs
- admin user listing
- prediction data model
- CSV import command
- user app automated tests

### In Progress / Partial

- prediction model API endpoints are not implemented yet
- `prediction/views.py` is still a placeholder
- `prediction/tests.py` is still a placeholder
- frontend does not currently contain application code
- ML training pipeline exists locally but is not yet committed

### Things to Improve Next

- connect CI and local commands to a clearly defined database mode
- add prediction APIs for inference and alert generation
- commit and validate the ML pipeline dependencies if the training flow will be used
- add frontend implementation
- add documentation for setup, environment variables, and API usage
- add tests for prediction and more end-to-end auth flows

## Summary

The project already has a solid backend foundation, especially around user authentication and account management. The next major phase is to turn the prediction module into a working API/service and then build the frontend on top of the existing backend endpoints.
