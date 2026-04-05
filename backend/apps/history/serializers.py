import logging

from rest_framework import serializers

from .models import History

logger = logging.getLogger(__name__)


class CreateHistorySerializer(serializers.ModelSerializer):
    def _validate_non_negative(self, attrs, field_name, label):
        value = attrs.get(field_name)
        if value is not None and value < 0:
            raise serializers.ValidationError(
                {field_name: f"{label} cannot be negative"}
            )

    def validate(self, attrs):
        self._validate_non_negative(attrs, "gas_level", "Gas level")
        self._validate_non_negative(attrs, "temperature", "Temperature")
        self._validate_non_negative(attrs, "pressure", "Pressure")
        self._validate_non_negative(attrs, "smoke_level", "Smoke level")

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
