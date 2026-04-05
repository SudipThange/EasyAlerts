import logging
import re

from django.conf import settings
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.db import DatabaseError, IntegrityError
from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers
from rest_framework_simplejwt.settings import api_settings
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken, OutstandingToken
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.utils import get_md5_hash_password

from .models import UserProfile

logger = logging.getLogger(__name__)

PHONE_NUMBER_REGEX = re.compile(r"^(?:\+91|91)?[6-9]\d{9}$")


def normalize_email_address(value):
    return value.strip().lower()


def normalize_phone_number(value):
    normalized_value = re.sub(r"[\s\-]", "", value or "")

    if normalized_value.startswith("+91"):
        normalized_value = normalized_value[3:]
    elif normalized_value.startswith("91") and len(normalized_value) == 12:
        normalized_value = normalized_value[2:]

    return normalized_value


def get_access_token_lifetime_seconds():
    lifetime = settings.SIMPLE_JWT["ACCESS_TOKEN_LIFETIME"]
    return int(lifetime.total_seconds())


def blacklist_user_refresh_tokens(user):
    outstanding_tokens = OutstandingToken.objects.filter(user=user)
    for outstanding_token in outstanding_tokens:
        BlacklistedToken.objects.get_or_create(token=outstanding_token)


def create_refresh_token_for_user(user):
    try:
        return RefreshToken.for_user(user)
    except (IntegrityError, DatabaseError):
        logger.exception(
            "Falling back to stateless refresh token creation for user %s because "
            "the outstanding token table could not be written",
            getattr(user, "email", user.pk),
        )

        token = RefreshToken()
        token[api_settings.USER_ID_CLAIM] = str(getattr(user, api_settings.USER_ID_FIELD))

        if api_settings.CHECK_REVOKE_TOKEN:
            token[api_settings.REVOKE_TOKEN_CLAIM] = get_md5_hash_password(user.password)

        return token


class UserRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        min_length=8,
        style={"input_type": "password"},
        error_messages={
            "required": "Password is required",
            "blank": "Password cannot be blank",
            "min_length": "Password must be at least 8 characters long",
        },
    )

    password_confirm = serializers.CharField(
        write_only=True,
        style={"input_type": "password"},
        error_messages={
            "required": "Password confirmation is required",
            "blank": "Password confirmation cannot be blank",
        },
    )

    class Meta:
        model = UserProfile
        fields = [
            "email",
            "phone_number",
            "first_name",
            "last_name",
            "password",
            "password_confirm",
        ]
        extra_kwargs = {
            "first_name": {
                "required": True,
                "error_messages": {
                    "required": "First name is required",
                    "blank": "First name cannot be blank",
                },
            },
            "last_name": {
                "required": True,
                "error_messages": {
                    "required": "Last name is required",
                    "blank": "Last name cannot be blank",
                },
            },
            "email": {
                "error_messages": {
                    "required": "Email address is required",
                    "blank": "Email cannot be blank",
                    "invalid": "Enter a valid email address",
                }
            },
            "phone_number": {
                "error_messages": {
                    "required": "Phone number is required",
                    "blank": "Phone number cannot be blank",
                }
            },
        }

    def validate_email(self, value):
        value = normalize_email_address(value)

        if UserProfile.objects.filter(email__iexact=value).exists():
            logger.warning("Registration attempt with existing email: %s", value)
            raise serializers.ValidationError(
                "This email address is already registered. Please use a different email or login."
            )

        return value

    def validate_phone_number(self, value):
        normalized_value = normalize_phone_number(value)

        if not normalized_value:
            raise serializers.ValidationError("Phone number cannot be empty")

        if not PHONE_NUMBER_REGEX.match(normalized_value):
            logger.warning("Invalid phone format attempt: %s", value)
            raise serializers.ValidationError(
                "Invalid phone number format. Use format: 9876543210 or +919876543210"
            )

        if UserProfile.objects.filter(phone_number=normalized_value).exists():
            logger.warning("Registration attempt with existing phone: %s", normalized_value)
            raise serializers.ValidationError(
                "This phone number is already registered. Please use a different number or login."
            )

        return normalized_value

    def validate(self, data):
        password = data.get("password")
        password_confirm = data.get("password_confirm")

        if not password or not password_confirm:
            raise serializers.ValidationError({"password": "Both password fields are required"})

        if password != password_confirm:
            logger.warning("Password mismatch during registration")
            raise serializers.ValidationError({"password": "The two password fields did not match"})

        self._validate_password_strength(password)
        return data

    @staticmethod
    def _validate_password_strength(password):
        validate_password(password)

        has_upper = any(character.isupper() for character in password)
        has_lower = any(character.islower() for character in password)
        has_digit = any(character.isdigit() for character in password)
        has_special = any(character in "@#$%^&*!_-" for character in password)

        if not (has_upper and has_lower and has_digit and has_special):
            raise serializers.ValidationError(
                {
                    "password": (
                        "Password must contain at least one uppercase letter, one lowercase "
                        "letter, one digit, and one special character (@, #, $, %, ^, &, *)"
                    )
                }
            )

    def create(self, validated_data):
        validated_data.pop("password_confirm", None)

        user = UserProfile.objects.create_user(
            email=validated_data["email"],
            phone_number=validated_data["phone_number"],
            first_name=validated_data["first_name"],
            last_name=validated_data["last_name"],
            password=validated_data["password"],
        )

        logger.info("New user registered successfully: %s", user.email)
        return user


class UserLoginSerializer(serializers.Serializer):
    email = serializers.EmailField(
        error_messages={
            "required": "Email address is required",
            "blank": "Email cannot be blank",
            "invalid": "Enter a valid email address",
        }
    )

    password = serializers.CharField(
        write_only=True,
        style={"input_type": "password"},
        error_messages={
            "required": "Password is required",
            "blank": "Password cannot be blank",
        },
    )

    access = serializers.CharField(read_only=True)
    refresh = serializers.CharField(read_only=True)
    user = serializers.SerializerMethodField(read_only=True)
    message = serializers.CharField(read_only=True)
    expires_in = serializers.IntegerField(read_only=True)

    def validate(self, data):
        email = normalize_email_address(data.get("email", ""))
        password = data.get("password")

        if not email or not password:
            raise serializers.ValidationError({"credentials": "Email and password are required"})

        user_obj = UserProfile.objects.filter(email__iexact=email).first()
        if not user_obj:
            logger.warning("Login attempt with non-existent email: %s", email)
            raise serializers.ValidationError({"email": "No user account found with this email address"})

        if not user_obj.is_active:
            logger.warning("Login attempt with inactive account: %s", email)
            raise serializers.ValidationError(
                {"account": "This account has been deactivated. Please contact support"}
            )

        user = authenticate(
            request=self.context.get("request"),
            username=email,
            password=password,
        )
        if not user:
            logger.warning("Failed login attempt for user: %s", email)
            raise serializers.ValidationError({"password": "Incorrect password. Please try again"})

        refresh = create_refresh_token_for_user(user)
        data["email"] = email
        data["access"] = str(refresh.access_token)
        data["refresh"] = str(refresh)
        data["user"] = user
        data["message"] = "Login successful. Welcome back!"
        data["expires_in"] = get_access_token_lifetime_seconds()

        logger.info("User logged in successfully: %s", email)
        return data

    def get_user(self, obj):
        user = obj.get("user")
        if user:
            return {
                "id": user.id,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "full_name": f"{user.first_name} {user.last_name}".strip(),
                "phone_number": user.phone_number,
                "role": user.role,
                "is_active": user.is_active,
            }
        return None


class UserLogoutSerializer(serializers.Serializer):
    refresh = serializers.CharField(
        write_only=True,
        help_text="Refresh token to be invalidated",
        error_messages={
            "required": "Refresh token is required for logout",
            "blank": "Refresh token cannot be blank",
        },
    )

    message = serializers.CharField(read_only=True)

    def validate(self, data):
        refresh_token = data.get("refresh")

        if not refresh_token:
            raise serializers.ValidationError({"refresh": "Refresh token is required"})

        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except TokenError as exc:
            logger.warning("Invalid token during logout: %s", exc)
            raise serializers.ValidationError(
                {"refresh": "Invalid or expired token. Please login again"}
            )

        data["message"] = "Logout successful. See you again!"
        logger.info("User logged out successfully")
        return data


class UserEditSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        required=False,
        min_length=8,
        style={"input_type": "password"},
        help_text="Leave blank if you do not want to change password",
        error_messages={
            "blank": "Password cannot be blank",
            "min_length": "Password must be at least 8 characters long",
        },
    )

    password_confirm = serializers.CharField(
        write_only=True,
        required=False,
        style={"input_type": "password"},
        help_text="Confirmation of new password",
        error_messages={"blank": "Password confirmation cannot be blank"},
    )

    class Meta:
        model = UserProfile
        fields = [
            "phone_number",
            "first_name",
            "last_name",
            "password",
            "password_confirm",
        ]
        extra_kwargs = {
            "first_name": {
                "required": False,
                "error_messages": {"blank": "First name cannot be blank"},
            },
            "last_name": {
                "required": False,
                "error_messages": {"blank": "Last name cannot be blank"},
            },
            "phone_number": {
                "required": False,
                "error_messages": {"blank": "Phone number cannot be blank"},
            },
        }

    def validate_phone_number(self, value):
        if not value:
            return value

        normalized_value = normalize_phone_number(value)

        if not PHONE_NUMBER_REGEX.match(normalized_value):
            logger.warning("Invalid phone format during edit: %s", value)
            raise serializers.ValidationError(
                "Invalid phone number format. Use: 9876543210 or +919876543210"
            )

        if self.instance and normalized_value == self.instance.phone_number:
            return normalized_value

        if self.instance and UserProfile.objects.exclude(id=self.instance.id).filter(
            phone_number=normalized_value
        ).exists():
            logger.warning("Phone number already in use: %s", normalized_value)
            raise serializers.ValidationError(
                "This phone number is already registered to another account"
            )

        return normalized_value

    def validate(self, data):
        password = data.get("password")
        password_confirm = data.get("password_confirm")

        if password or password_confirm:
            if not password:
                raise serializers.ValidationError(
                    {"password": "Password is required when changing your password"}
                )

            if not password_confirm:
                raise serializers.ValidationError(
                    {"password_confirm": "Password confirmation is required"}
                )

            if password != password_confirm:
                logger.warning("Password mismatch during profile edit")
                raise serializers.ValidationError({"password": "The two password fields did not match"})

            UserRegisterSerializer._validate_password_strength(password)

        return data

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)
        validated_data.pop("password_confirm", None)

        for attr, value in validated_data.items():
            if value is not None:
                setattr(instance, attr, value)

        instance._password_changed = False
        if password:
            instance.set_password(password)
            blacklist_user_refresh_tokens(instance)
            instance._password_changed = True
            logger.info("Password updated for user: %s", instance.email)

        instance.save()
        logger.info("Profile updated for user: %s", instance.email)
        return instance


class UserViewSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = UserProfile
        fields = [
            "id",
            "email",
            "phone_number",
            "first_name",
            "last_name",
            "full_name",
            "role",
            "is_active",
            "created_at",
            "modified_at",
        ]
        read_only_fields = fields

    @extend_schema_field(serializers.CharField())
    def get_full_name(self, obj):
        full_name = f"{obj.first_name} {obj.last_name}".strip()
        return full_name if full_name else "N/A"


class UserTokenResponseSerializer(serializers.Serializer):
    access = serializers.CharField(help_text="JWT access token for API requests")
    refresh = serializers.CharField(help_text="JWT refresh token for obtaining new access tokens")
    user = UserViewSerializer(help_text="User profile information")
    message = serializers.CharField(help_text="Response message")
    expires_in = serializers.SerializerMethodField(
        help_text="Access token expiration time in seconds"
    )

    def get_expires_in(self, obj):
        return get_access_token_lifetime_seconds()


class StandardErrorResponseSerializer(serializers.Serializer):
    success = serializers.BooleanField(required=False)
    message = serializers.CharField(required=False)
    errors = serializers.JSONField(required=False)
    error = serializers.CharField(required=False)


class UserLoginRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)


class UserRegistrationSuccessSerializer(serializers.Serializer):
    success = serializers.BooleanField()
    message = serializers.CharField()
    user = UserViewSerializer()


class UserLoginSuccessSerializer(serializers.Serializer):
    success = serializers.BooleanField()
    message = serializers.CharField()
    access = serializers.CharField()
    refresh = serializers.CharField()
    expires_in = serializers.IntegerField()
    user = UserViewSerializer()


class UserLogoutSuccessSerializer(serializers.Serializer):
    success = serializers.BooleanField()
    message = serializers.CharField()


class UserProfileSuccessSerializer(serializers.Serializer):
    success = serializers.BooleanField()
    message = serializers.CharField()
    user = UserViewSerializer()


class UserUpdateSuccessSerializer(serializers.Serializer):
    success = serializers.BooleanField()
    message = serializers.CharField()
    force_reauthentication = serializers.BooleanField()
    user = UserViewSerializer()


class PaginationSerializer(serializers.Serializer):
    page = serializers.IntegerField()
    per_page = serializers.IntegerField()
    total = serializers.IntegerField()
    total_pages = serializers.IntegerField()


class UserListSuccessSerializer(serializers.Serializer):
    success = serializers.BooleanField()
    message = serializers.CharField()
    data = UserViewSerializer(many=True)
    pagination = PaginationSerializer()


class TokenRefreshRequestSerializer(serializers.Serializer):
    refresh = serializers.CharField()


class TokenRefreshResponseSerializer(serializers.Serializer):
    access = serializers.CharField()


class TokenVerifyRequestSerializer(serializers.Serializer):
    token = serializers.CharField()


class EmptyResponseSerializer(serializers.Serializer):
    pass
