from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.conf import settings

def send_verification_email(user, verification_url):
    subject = 'Verify Your Email Address'
    html_message = render_to_string('email/verification_email.html', {
        'user': user,
        'verification_url': verification_url,
    })
    plain_message = strip_tags(html_message)
    
    send_mail(
        subject,
        plain_message,
        settings.DEFAULT_FROM_EMAIL,
        [user.email],
        html_message=html_message,
        fail_silently=False,
    )

def send_password_reset_email(user, reset_url):
    subject = 'Password Reset Request'
    html_message = render_to_string('email/password_reset_email.html', {
        'user': user,
        'reset_url': reset_url,
    })
    plain_message = strip_tags(html_message)
    
    send_mail(
        subject,
        plain_message,
        settings.DEFAULT_FROM_EMAIL,
        [user.email],
        html_message=html_message,
        fail_silently=False,
    )

def send_welcome_email(user, temp_password):
    subject = 'Welcome to Our Platform'
    message = f'''
    Hello {user.first_name},
    
    Your account has been created. Please use the following temporary password to log in:
    
    Temporary Password: {temp_password}
    
    You will be prompted to change your password on first login.
    
    Login here: {settings.FRONTEND_URL}/login
    '''
    
    # # For HTML email, you might want to use a template
    html_message = f'''
    <h2>Welcome to Our Platform</h2>
    <p>Hello {user.first_name},</p>
    <p>Your account has been created. Please use the following temporary password to log in:</p>
    <p><strong>Temporary Password:</strong> {temp_password}</p>
    <p>You will be prompted to change your password on first login.</p>
    <p><a href="{settings.FRONTEND_URL}/login">Click here to login</a></p>
    '''
    
    send_mail(
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL,
        [user.email],
        html_message=html_message,
        fail_silently=False,
    )