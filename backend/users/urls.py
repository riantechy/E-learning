from django.urls import path
from .views import (
    RegisterView, LoginView, UserProfileView,
    UserListView, UserDetailView, UserUpdateView, UserDeleteView,
    ChangePasswordView, LogoutView
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('profile/', UserProfileView.as_view(), name='profile'),
    path('change-password/', ChangePasswordView.as_view(), name='change_password'),

    path('all/', UserListView.as_view(), name='user-list'),
    path('users/<uuid:pk>/', UserDetailView.as_view(), name='user-detail'),
    path('users/<uuid:pk>/update/', UserUpdateView.as_view(), name='user-update'),
    path('users/<uuid:pk>/delete/', UserDeleteView.as_view(), name='user-delete'),
]
