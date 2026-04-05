from pathlib import Path

from django.db import connections
from django.http import JsonResponse
from django.views import View

from apps.prediction.ml.predict import model_path


class HealthCheckView(View):
    def get(self, request, *args, **kwargs):
        checks = {
            "database": "ok",
            "model_file": "ok",
        }
        status_code = 200

        try:
            with connections["default"].cursor() as cursor:
                cursor.execute("SELECT 1")
        except Exception:
            checks["database"] = "error"
            status_code = 503

        if not Path(model_path).exists():
            checks["model_file"] = "missing"
            status_code = 503

        return JsonResponse(
            {
                "status": "ok" if status_code == 200 else "degraded",
                "checks": checks,
            },
            status=status_code,
        )
