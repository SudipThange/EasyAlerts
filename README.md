# EasyAlerts

EasyAlerts is a full-stack hazard-detection app with a Django API in `backend/` and a React/Vite frontend in `frontend/`.

## Deployment Checklist

1. Copy `.env.example` to `.env` and set real production values.
2. Set `DJANGO_DEBUG=False`, a real `DJANGO_SECRET_KEY`, and real `DJANGO_ALLOWED_HOSTS`.
3. If frontend and backend are on different origins, set:
   - `DJANGO_CORS_ALLOW_ALL_ORIGINS=False`
   - `DJANGO_CORS_ALLOWED_ORIGINS=https://your-frontend-domain`
   - `DJANGO_CSRF_TRUSTED_ORIGINS=https://your-frontend-domain`
   - `VITE_API_URL=https://your-backend-domain`
4. If frontend is served behind the same origin as the API, leave `VITE_API_URL` unset in production so the frontend uses the current host automatically.

## Backend

Install backend dependencies:

```powershell
cd backend
pip install -r requirements.txt
```

Run startup tasks:

```powershell
python manage.py migrate
python manage.py collectstatic --noinput
```

Production entrypoint:

```powershell
gunicorn easyalerts.wsgi:application -c gunicorn.conf.py
```

The repo also includes `backend/Procfile` for Procfile-based platforms.

Health endpoint:

```text
/api/health/
```

It returns `200` when the app can reach the database and the prediction model file exists.

## Frontend

Install and build:

```powershell
cd frontend
npm ci
npm run build
```

Deploy the generated `frontend/dist/` directory to your static host.

If you use SPA routing on a static host, configure a rewrite so unknown routes like `/history` and `/detect` serve `index.html`.

## Verification

Backend checks:

```powershell
cd backend
python manage.py check
python manage.py test
```

Frontend build:

```powershell
cd frontend
npm run build
```
