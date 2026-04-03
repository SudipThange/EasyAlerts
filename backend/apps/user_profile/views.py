import logging

from drf_spectacular.utils import OpenApiParameter, OpenApiResponse, extend_schema
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenRefreshView, TokenVerifyView

from .models import UserProfile
from .serializers import (
    EmptyResponseSerializer,
    StandardErrorResponseSerializer,
    TokenRefreshRequestSerializer,
    TokenRefreshResponseSerializer,
    TokenVerifyRequestSerializer,
    UserEditSerializer,
    UserListSuccessSerializer,
    UserLoginRequestSerializer,
    UserLoginSerializer,
    UserLoginSuccessSerializer,
    UserLogoutSerializer,
    UserLogoutSuccessSerializer,
    UserProfileSuccessSerializer,
    UserRegisterSerializer,
    UserRegistrationSuccessSerializer,
    UserUpdateSuccessSerializer,
    UserViewSerializer,
)

logger = logging.getLogger(__name__)


@extend_schema(
    tags=["Authentication"],
    summary="Refresh JWT access token",
    request=TokenRefreshRequestSerializer,
    responses={
        200: TokenRefreshResponseSerializer,
        400: OpenApiResponse(response=StandardErrorResponseSerializer, description="Invalid refresh token."),
        401: OpenApiResponse(response=StandardErrorResponseSerializer, description="Unauthorized."),
    },
    auth=[],
)
class DocumentedTokenRefreshView(TokenRefreshView):
    pass


@extend_schema(
    tags=["Authentication"],
    summary="Verify JWT token",
    request=TokenVerifyRequestSerializer,
    responses={
        200: OpenApiResponse(response=EmptyResponseSerializer, description="Token is valid."),
        400: OpenApiResponse(response=StandardErrorResponseSerializer, description="Invalid token."),
        401: OpenApiResponse(response=StandardErrorResponseSerializer, description="Unauthorized."),
    },
    auth=[],
)
class DocumentedTokenVerifyView(TokenVerifyView):
    pass


class UserRegisterView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    @extend_schema(
        tags=["Authentication"],
        summary="Register a new user",
        request=UserRegisterSerializer,
        responses={
            201: UserRegistrationSuccessSerializer,
            400: StandardErrorResponseSerializer,
            500: StandardErrorResponseSerializer,
        },
        auth=[],
    )
    def post(self, request):
        try:
            serializer = UserRegisterSerializer(data=request.data)

            if serializer.is_valid():
                user = serializer.save()
                response_serializer = UserViewSerializer(user)
                return Response(
                    {
                        "success": True,
                        "message": "Account created successfully. You can now login.",
                        "user": response_serializer.data,
                    },
                    status=status.HTTP_201_CREATED,
                )

            logger.warning("Registration validation failed: %s", serializer.errors)
            return Response(
                {
                    "success": False,
                    "message": "Registration failed. Please check your input.",
                    "errors": serializer.errors,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as exc:
            logger.exception("Unexpected error in user registration")
            return Response(
                {
                    "success": False,
                    "message": "An unexpected error occurred during registration",
                    "error": str(exc),
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class UserLoginView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    @extend_schema(
        tags=["Authentication"],
        summary="Login user and return JWT tokens",
        request=UserLoginRequestSerializer,
        responses={
            200: UserLoginSuccessSerializer,
            401: StandardErrorResponseSerializer,
            500: StandardErrorResponseSerializer,
        },
        auth=[],
    )
    def post(self, request):
        try:
            serializer = UserLoginSerializer(data=request.data, context={"request": request})

            if serializer.is_valid():
                validated_data = serializer.validated_data
                user = validated_data.get("user")
                return Response(
                    {
                        "success": True,
                        "message": validated_data.get("message", "Login successful"),
                        "access": validated_data.get("access"),
                        "refresh": validated_data.get("refresh"),
                        "expires_in": validated_data.get("expires_in"),
                        "user": UserViewSerializer(user).data,
                    },
                    status=status.HTTP_200_OK,
                )

            logger.warning("Login validation failed: %s", serializer.errors)
            return Response(
                {
                    "success": False,
                    "message": "Invalid email or password",
                    "errors": serializer.errors,
                },
                status=status.HTTP_401_UNAUTHORIZED,
            )
        except Exception as exc:
            logger.exception("Unexpected error in user login")
            return Response(
                {
                    "success": False,
                    "message": "An unexpected error occurred during login",
                    "error": str(exc),
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class UserLogoutView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    @extend_schema(
        tags=["Authentication"],
        summary="Logout user by blacklisting refresh token",
        request=UserLogoutSerializer,
        responses={
            200: UserLogoutSuccessSerializer,
            400: StandardErrorResponseSerializer,
            500: StandardErrorResponseSerializer,
        },
        auth=[],
    )
    def post(self, request):
        try:
            serializer = UserLogoutSerializer(data=request.data)

            if serializer.is_valid():
                return Response(
                    {
                        "success": True,
                        "message": serializer.validated_data.get("message", "Logout successful"),
                    },
                    status=status.HTTP_200_OK,
                )

            logger.warning("Logout validation failed: %s", serializer.errors)
            return Response(
                {
                    "success": False,
                    "message": "Logout failed. Invalid token provided.",
                    "errors": serializer.errors,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as exc:
            logger.exception("Unexpected error in user logout")
            return Response(
                {
                    "success": False,
                    "message": "An unexpected error occurred during logout",
                    "error": str(exc),
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class UserEditProfileView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        tags=["Users"],
        summary="Update the authenticated user's profile",
        request=UserEditSerializer,
        responses={
            200: UserUpdateSuccessSerializer,
            400: StandardErrorResponseSerializer,
            401: StandardErrorResponseSerializer,
            500: StandardErrorResponseSerializer,
        },
    )
    def patch(self, request):
        try:
            user = request.user

            if not user or not user.is_authenticated:
                return Response(
                    {"success": False, "message": "Authentication required"},
                    status=status.HTTP_401_UNAUTHORIZED,
                )

            serializer = UserEditSerializer(user, data=request.data, partial=True)

            if serializer.is_valid():
                updated_user = serializer.save()
                response_serializer = UserViewSerializer(updated_user)
                password_changed = getattr(updated_user, "_password_changed", False)
                message = "Profile updated successfully"

                if password_changed:
                    message = "Profile updated successfully. Password changed, please log in again."

                return Response(
                    {
                        "success": True,
                        "message": message,
                        "force_reauthentication": password_changed,
                        "user": response_serializer.data,
                    },
                    status=status.HTTP_200_OK,
                )

            logger.warning("Profile update validation failed: %s", serializer.errors)
            return Response(
                {
                    "success": False,
                    "message": "Profile update failed. Please check your input.",
                    "errors": serializer.errors,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as exc:
            logger.exception("Unexpected error in profile update")
            return Response(
                {
                    "success": False,
                    "message": "An unexpected error occurred during profile update",
                    "error": str(exc),
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class UserViewProfileView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        tags=["Users"],
        summary="Get the authenticated user's profile",
        responses={
            200: UserProfileSuccessSerializer,
            401: StandardErrorResponseSerializer,
            404: StandardErrorResponseSerializer,
            500: StandardErrorResponseSerializer,
        },
    )
    def get(self, request):
        try:
            user = request.user

            if not user or not user.is_authenticated:
                return Response(
                    {"success": False, "message": "Authentication required"},
                    status=status.HTTP_401_UNAUTHORIZED,
                )

            try:
                user = UserProfile.objects.get(id=user.id)
                serializer = UserViewSerializer(user)
                return Response(
                    {
                        "success": True,
                        "message": "Profile retrieved successfully",
                        "user": serializer.data,
                    },
                    status=status.HTTP_200_OK,
                )
            except UserProfile.DoesNotExist:
                logger.error("User not found: %s", user.id)
                return Response(
                    {"success": False, "message": "User profile not found"},
                    status=status.HTTP_404_NOT_FOUND,
                )
            except Exception as exc:
                logger.exception("Error fetching profile")
                return Response(
                    {
                        "success": False,
                        "message": "Failed to retrieve profile",
                        "error": str(exc),
                    },
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )
        except Exception as exc:
            logger.exception("Unexpected error in profile view")
            return Response(
                {
                    "success": False,
                    "message": "An unexpected error occurred while retrieving profile",
                    "error": str(exc),
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class UserListView(APIView):
    permission_classes = [IsAuthenticated]

    @staticmethod
    def _parse_positive_integer(value, field_name, default_value, max_value=None):
        if value in (None, ""):
            return default_value

        try:
            parsed_value = int(value)
        except (TypeError, ValueError) as exc:
            raise ValueError(f"{field_name} must be an integer.") from exc

        if parsed_value < 1:
            raise ValueError(f"{field_name} must be greater than or equal to 1.")

        if max_value is not None and parsed_value > max_value:
            raise ValueError(f"{field_name} must be less than or equal to {max_value}.")

        return parsed_value

    @extend_schema(
        tags=["Users"],
        summary="List users for admin accounts",
        parameters=[
            OpenApiParameter(name="page", description="Page number", required=False, type=int),
            OpenApiParameter(name="per_page", description="Users per page (max 100)", required=False, type=int),
        ],
        responses={
            200: UserListSuccessSerializer,
            400: StandardErrorResponseSerializer,
            403: StandardErrorResponseSerializer,
            500: StandardErrorResponseSerializer,
        },
    )
    def get(self, request):
        try:
            user = request.user

            if not (user.is_staff or user.is_superuser or user.role == "admin"):
                logger.warning("Unauthorized access attempt by user: %s", user.email)
                return Response(
                    {"success": False, "message": "Admin access required"},
                    status=status.HTTP_403_FORBIDDEN,
                )

            try:
                page = self._parse_positive_integer(
                    request.query_params.get("page"),
                    "page",
                    default_value=1,
                )
                per_page = self._parse_positive_integer(
                    request.query_params.get("per_page"),
                    "per_page",
                    default_value=20,
                    max_value=100,
                )
            except ValueError as exc:
                return Response(
                    {
                        "success": False,
                        "message": "Invalid pagination parameters.",
                        "errors": {"pagination": [str(exc)]},
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            try:
                start = (page - 1) * per_page
                end = start + per_page

                users = UserProfile.objects.all()[start:end]
                total_count = UserProfile.objects.count()
                serializer = UserViewSerializer(users, many=True)

                return Response(
                    {
                        "success": True,
                        "message": "Users retrieved successfully",
                        "data": serializer.data,
                        "pagination": {
                            "page": page,
                            "per_page": per_page,
                            "total": total_count,
                            "total_pages": (total_count + per_page - 1) // per_page,
                        },
                    },
                    status=status.HTTP_200_OK,
                )
            except Exception as exc:
                logger.exception("Error fetching users list")
                return Response(
                    {
                        "success": False,
                        "message": "Failed to retrieve users list",
                        "error": str(exc),
                    },
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )
        except Exception as exc:
            logger.exception("Unexpected error in user list view")
            return Response(
                {
                    "success": False,
                    "message": "An unexpected error occurred",
                    "error": str(exc),
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
