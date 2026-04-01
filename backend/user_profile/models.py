from django.contrib.auth.base_user import BaseUserManager
from django.contrib.auth.models import AbstractUser
from django.core.validators import RegexValidator
from django.db import models


class UserProfileManager(BaseUserManager):
    def _create_user(self, email, password, **extra_fields):
        if not email:
            raise ValueError('The email address must be set.')

        email = email.strip().lower()
        extra_fields['username'] = email
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', False)
        extra_fields.setdefault('is_superuser', False)
        if extra_fields.get('role') == 'admin':
            extra_fields['is_staff'] = True
        return self._create_user(email, password, **extra_fields)

    def create_superuser(self, email, password, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'admin')

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self._create_user(email, password, **extra_fields)


class UserProfile(AbstractUser):
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('user', 'User'),
    ]

    phone_number_pattern = RegexValidator(
        regex=r'^(?:\+91|91)?[6-9]\d{9}$',
        message='Phone format: +919999999999 (with +91) OR 9999999999 (without +91)',
    )

    email = models.EmailField(unique=True)
    phone_number = models.CharField(
        max_length=13,
        validators=[phone_number_pattern],
        unique=True,
    )
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='user')

    created_at = models.DateTimeField(auto_now_add=True)
    modified_at = models.DateTimeField(auto_now=True)

    groups = models.ManyToManyField(
        'auth.Group',
        related_name='userprofile_set',
        blank=True,
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        related_name='userprofile_set',
        blank=True,
    )

    objects = UserProfileManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name', 'phone_number']

    def save(self, *args, **kwargs):
        if self.email:
            self.email = self.email.strip().lower()
            self.username = self.email

        if self.is_superuser:
            self.is_staff = True
            self.role = 'admin'
        else:
            self.is_staff = self.role == 'admin'

        super().save(*args, **kwargs)

    def __str__(self):
        return f'Email: {self.email} | Is Active: {self.is_active} | Role: {self.role}'

    class Meta:
        db_table = 'user_profile'
        ordering = ['-created_at']
        verbose_name = 'User Profile'
        verbose_name_plural = 'User Profiles'
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['phone_number']),
        ]
