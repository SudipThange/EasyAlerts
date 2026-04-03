import logging

from django.contrib.auth import get_user_model
from django.db import models

User = get_user_model()
logger = logging.getLogger(__name__)


class History(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="sensor_history")
    timestamp = models.DateTimeField(auto_now_add=True)
    gas_level = models.FloatField()
    temperature = models.FloatField()
    pressure = models.FloatField()
    smoke_level = models.FloatField()
    prediction_label = models.CharField(max_length=50, null=True, blank=True)
    confidence_score = models.FloatField(null=True, blank=True)

    def save(self, *args, **kwargs):
        is_create = self._state.adding
        super().save(*args, **kwargs)
        logger.info(
            "History record %s for user=%s label=%s confidence_score=%s",
            "created" if is_create else "updated",
            getattr(self.user, "email", self.user_id),
            self.prediction_label,
            self.confidence_score,
        )

    def __str__(self):
        return f"{self.user.username} - Reading at {self.timestamp}"

    class Meta:
        db_table = "user_history"
        ordering = ["-timestamp"]
