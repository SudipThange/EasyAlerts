import logging

from rest_framework import serializers

from .models import History

logger = logging.getLogger(__name__)


class CreateHistorySerializer(serializers.ModelSerializer):
    def validate(self, attrs):
        logger.info(
            "History input validated for prediction gas=%s temperature=%s pressure=%s smoke=%s",
            attrs.get("gas_level"),
            attrs.get("temperature"),
            attrs.get("pressure"),
            attrs.get("smoke_level"),
        )
        return attrs

    class Meta:
        model = History
        fields = [
            "gas_level",
            "temperature",
            "pressure",
            "smoke_level",
        ]


class ListHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = History
        fields = [
            "timestamp",
            "gas_level",
            "temperature",
            "pressure",
            "smoke_level",
            "prediction_label",
            "confidence_score",
        ]


class HistoryCreateSuccessSerializer(serializers.Serializer):
    message = serializers.CharField()
    history = ListHistorySerializer()


class HistoryErrorSerializer(serializers.Serializer):
    message = serializers.CharField(required=False)
    errors = serializers.JSONField(required=False)
