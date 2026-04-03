import logging

from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from prediction.ml.predict import predict

from .models import History
from .serializers import (
    CreateHistorySerializer,
    HistoryCreateSuccessSerializer,
    HistoryErrorSerializer,
    ListHistorySerializer,
)

logger = logging.getLogger(__name__)


class HistoryView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        tags=["History"],
        summary="Get history for the authenticated user",
        responses={
            200: ListHistorySerializer(many=True),
            500: HistoryErrorSerializer,
        },
    )
    def get(self, request):
        try:
            history = History.objects.filter(user=request.user)
            serializer = ListHistorySerializer(history, many=True)
            logger.info(
                "Fetched %s history records for user=%s",
                history.count(),
                request.user.email,
            )
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception:
            logger.exception("Unexpected error while fetching history for user=%s", request.user.email)
            return Response(
                {"message": "Failed to fetch history."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @extend_schema(
        tags=["History"],
        summary="Create a history record from sensor readings",
        request=CreateHistorySerializer,
        responses={
            201: HistoryCreateSuccessSerializer,
            400: HistoryErrorSerializer,
            500: HistoryErrorSerializer,
        },
    )
    def post(self, request):
        try:
            serializer = CreateHistorySerializer(data=request.data)

            if not serializer.is_valid():
                logger.warning("History create validation failed for user=%s: %s", request.user.email, serializer.errors)
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

            validated_data = serializer.validated_data
            prediction_result = predict(
                gas_level=validated_data["gas_level"],
                temperature=validated_data["temperature"],
                pressure=validated_data["pressure"],
                smoke_level=validated_data["smoke_level"],
            )

            logger.info(
                "Prediction generated for user=%s label=%s confidence_score=%s",
                request.user.email,
                prediction_result["prediction_label"],
                prediction_result["confidence_score"],
            )

            history = serializer.save(
                user=request.user,
                prediction_label=prediction_result["prediction_label"],
                confidence_score=prediction_result["confidence_score"],
            )

            logger.info("History record stored for user=%s id=%s", request.user.email, history.id)
            return Response(
                {
                    "message": "Reading saved successfully!",
                    "history": ListHistorySerializer(history).data,
                },
                status=status.HTTP_201_CREATED,
            )
        except Exception:
            logger.exception("Unexpected error while creating history for user=%s", request.user.email)
            return Response(
                {"message": "Failed to save history."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class AdminHistoryView(APIView):
    permission_classes = [IsAdminUser]

    @extend_schema(
        tags=["History"],
        summary="Get all history records for admin users",
        responses={
            200: ListHistorySerializer(many=True),
            500: HistoryErrorSerializer,
        },
    )
    def get(self, request):
        try:
            history = History.objects.all()
            serializer = ListHistorySerializer(history, many=True)
            logger.info(
                "Admin history fetch by user=%s returned %s records",
                request.user.email,
                history.count(),
            )
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception:
            logger.exception("Unexpected error while admin user=%s fetched history", request.user.email)
            return Response(
                {"message": "Failed to fetch history."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
