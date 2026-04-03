import logging

from django.contrib import admin

from .models import History

logger = logging.getLogger(__name__)


@admin.register(History)
class HistoryAdmin(admin.ModelAdmin):
    list_display = (
        "user",
        "timestamp",
        "prediction_label",
        "confidence_score",
        "gas_level",
        "temperature",
        "pressure",
        "smoke_level",
    )
    list_filter = ("prediction_label", "timestamp")
    search_fields = ("user__email", "user__username", "prediction_label")

    def save_model(self, request, obj, form, change):
        super().save_model(request, obj, form, change)
        logger.info(
            "Admin user=%s %s history id=%s",
            request.user.email,
            "updated" if change else "created",
            obj.id,
        )
