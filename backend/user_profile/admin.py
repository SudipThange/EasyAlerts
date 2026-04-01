from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .forms import UserProfileChangeForm, UserProfileCreationForm
from .models import UserProfile


@admin.register(UserProfile)
class UserProfileAdmin(UserAdmin):
    add_form = UserProfileCreationForm
    form = UserProfileChangeForm
    model = UserProfile

    list_display = (
        'email',
        'first_name',
        'last_name',
        'phone_number',
        'role',
        'is_staff',
        'is_active',
    )
    list_filter = ('role', 'is_staff', 'is_superuser', 'is_active', 'groups')
    ordering = ('email',)
    search_fields = ('email', 'first_name', 'last_name', 'phone_number')
    readonly_fields = ('last_login', 'date_joined', 'created_at', 'modified_at')

    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal info', {'fields': ('first_name', 'last_name', 'phone_number', 'role')}),
        (
            'Permissions',
            {
                'fields': (
                    'is_active',
                    'is_staff',
                    'is_superuser',
                    'groups',
                    'user_permissions',
                )
            },
        ),
        ('Important dates', {'fields': ('last_login', 'date_joined', 'created_at', 'modified_at')}),
    )

    add_fieldsets = (
        (
            None,
            {
                'classes': ('wide',),
                'fields': (
                    'email',
                    'first_name',
                    'last_name',
                    'phone_number',
                    'role',
                    'password1',
                    'password2',
                ),
            },
        ),
    )
