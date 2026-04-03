from django.contrib.auth.forms import UserChangeForm, UserCreationForm

from .models import UserProfile


class UserProfileCreationForm(UserCreationForm):
    class Meta:
        model = UserProfile
        fields = ('email', 'first_name', 'last_name', 'phone_number', 'role')

    def clean_email(self):
        return self.cleaned_data['email'].strip().lower()


class UserProfileChangeForm(UserChangeForm):
    class Meta:
        model = UserProfile
        fields = (
            'email',
            'first_name',
            'last_name',
            'phone_number',
            'role',
            'is_active',
            'is_staff',
            'is_superuser',
            'groups',
            'user_permissions',
        )

    def clean_email(self):
        return self.cleaned_data['email'].strip().lower()
