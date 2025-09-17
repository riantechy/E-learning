from django.urls import path
from .views import (
    RegisterView, LoginView, UserProfileView, ForceChangePasswordView,
    UserListView, UserDetailView, UserUpdateView, UserDeleteView, UserDistributionView,
    ChangePasswordView, LogoutView, LearnerListView, NonLearnerListView, 
    UserCreateView, LearnerCountView, ProfileImageView, PasswordResetConfirmView,
    VerifyEmailView, ResendVerificationEmailView, PasswordResetRequestView
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('profile/', UserProfileView.as_view(), name='profile'),
    path('change-password/', ChangePasswordView.as_view(), name='change_password'),

    path('users/learners/', LearnerListView.as_view(), name='learner-list'),
    path('users/non-learners/', NonLearnerListView.as_view(), name='non-learner-list'),

    # User management endpoints
    path('users/', UserListView.as_view(), name='user-list'),
    path('users/create/', UserCreateView.as_view(), name='user-create'), 
    # path('users/admin/create/', AdminUserCreate.as_view(), name='user-admin-create'),   
    path('users/<uuid:pk>/', UserDetailView.as_view(), name='user-detail'),
    path('users/update/<uuid:pk>/', UserUpdateView.as_view(), name='user-update'),
    path('users/delete/<uuid:pk>/', UserDeleteView.as_view(), name='user-delete'),
    path('profile/image/', ProfileImageView.as_view(), name='profile-image'),
    
    # Keep the old 'all/' endpoint for backward compatibility
    path('learners/count/', LearnerCountView.as_view(), name='learner-count'),
    path('all/', UserListView.as_view(), name='user-list-old'),
    path('users/distribution/', UserDistributionView.as_view(), name='user-distribution'),

    path('verify-email/<uuid:token>/', VerifyEmailView.as_view(), name='verify-email'),
    path('resend-verification-email/', ResendVerificationEmailView.as_view(), name='resend-verification-email'),
    path('request-password-reset/', PasswordResetRequestView.as_view(), name='request-password-reset'),
    path('reset-password/<uuid:token>/', PasswordResetConfirmView.as_view(), name='reset-password-confirm'),
    path('force-change-password/', ForceChangePasswordView.as_view(), name='force-change-password'),
]
