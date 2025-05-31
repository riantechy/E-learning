from django.urls import path
from .views import (
    RegisterView, LoginView, UserProfileView,
    UserListView, UserDetailView, UserUpdateView, UserDeleteView,
    ChangePasswordView, LogoutView, LearnerListView, NonLearnerListView, 
    UserCreateView 
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
    path('users/<uuid:pk>/', UserDetailView.as_view(), name='user-detail'),
    path('users/update/<uuid:pk>/', UserUpdateView.as_view(), name='user-update'),
    path('users/delete/<uuid:pk>/', UserDeleteView.as_view(), name='user-delete'),
    
    # Keep the old 'all/' endpoint for backward compatibility
    path('all/', UserListView.as_view(), name='user-list-old'),
]
