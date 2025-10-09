# email_utils.py
import logging
import socket
from django.core.mail import send_mail, BadHeaderError, get_connection
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.conf import settings
from django.core.exceptions import ValidationError
from django.template.exceptions import TemplateDoesNotExist

logger = logging.getLogger(__name__)

def test_smtp_connectivity():
    """Test if we can connect to the SMTP server"""
    try:
        # Test basic network connectivity first
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(10)
        result = sock.connect_ex((settings.EMAIL_HOST, settings.EMAIL_PORT))
        sock.close()
        
        if result != 0:
            logger.error(f"Network connectivity test failed to {settings.EMAIL_HOST}:{settings.EMAIL_PORT}")
            return False
            
        # Test SMTP connection
        connection = get_connection()
        connection.open()
        connection.close()
        logger.info("SMTP connection test successful")
        return True
        
    except Exception as e:
        logger.error(f"SMTP connectivity test failed: {str(e)}")
        return False

def send_email_with_fallback(subject, plain_message, recipient_list, html_message=None):
    """Send email with fallback to console if SMTP fails"""
    
    # Test connectivity first
    if not test_smtp_connectivity():
        logger.warning("SMTP connection failed, falling back to console output")
        
        # Log email to console (for development)
        print("\n" + "="*60)
        print("EMAIL WOULD BE SENT (SMTP UNAVAILABLE):")
        print(f"To: {recipient_list}")
        print(f"Subject: {subject}")
        print(f"Message: {plain_message}")
        if html_message:
            print(f"HTML: {html_message}")
        print("="*60 + "\n")
        return 1  # Simulate success for development
        
    try:
        if html_message:
            from django.core.mail import EmailMultiAlternatives
            email = EmailMultiAlternatives(
                subject=subject,
                body=plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=recipient_list
            )
            email.attach_alternative(html_message, "text/html")
            return email.send()
        else:
            return send_mail(
                subject=subject,
                message=plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=recipient_list,
                fail_silently=False
            )
    except Exception as e:
        logger.error(f"Email sending failed: {str(e)}")
        # Fallback to console
        print(f"\nEMAIL FAILED - Would send to {recipient_list}: {subject}\n")
        print(f"Message: {plain_message}\n")
        return 0

def send_verification_email(user, verification_url):
    try:
        logger.info(f"=== EMAIL DEBUG INFO ===")
        logger.info(f"EMAIL_BACKEND: {settings.EMAIL_BACKEND}")
        logger.info(f"EMAIL_HOST: {settings.EMAIL_HOST}")
        logger.info(f"EMAIL_PORT: {settings.EMAIL_PORT}")
        logger.info(f"EMAIL_USE_TLS: {settings.EMAIL_USE_TLS}")
        logger.info(f"EMAIL_HOST_USER: {settings.EMAIL_HOST_USER}")
        logger.info(f"DEFAULT_FROM_EMAIL: {settings.DEFAULT_FROM_EMAIL}")

        subject = 'Verify Your Email Address - WhiteBox'
        
        # Try multiple template paths with fallbacks
        html_message = None
        template_paths = [
            'email/verification_email.html',  
            'verification_email.html',        
        ]
        
        for template_path in template_paths:
            try:
                html_message = render_to_string(template_path, {
                    'user': user,
                    'verification_url': verification_url,
                })
                logger.info(f"Successfully rendered template: {template_path}")
                break
            except TemplateDoesNotExist:
                logger.warning(f"Template not found: {template_path}, trying next...")
                continue
            except Exception as template_error:
                logger.warning(f"Error rendering template {template_path}: {str(template_error)}, trying next...")
                continue
        
        # If no template worked, create a plain text fallback
        if html_message is None:
            logger.warning("No HTML template found, using plain text fallback")
            plain_message = f"""
            Welcome to WhiteBox, {user.first_name}!
            
            Thank you for registering. Please verify your email address by clicking the link below:
            
            {verification_url}
            
            If you didn't create an account, please ignore this email.
            
            Best regards,
            WhiteBox Team
            """
            html_message = None
        else:
            plain_message = strip_tags(html_message)
        
        logger.info(f"Attempting to send verification email to {user.email}")
        
        # Use the fallback function
        result = send_email_with_fallback(
            subject=subject,
            plain_message=plain_message,
            recipient_list=[user.email],
            html_message=html_message
        )
            
        logger.info(f"Verification email sent to {user.email}. Result: {result}")
        return result
        
    except BadHeaderError:
        logger.error("Invalid header found in email")
        raise ValidationError("Invalid email header")
    except Exception as e:
        logger.error(f"Failed to send verification email to {user.email}: {str(e)}", exc_info=True)
        raise

def send_password_reset_email(user, reset_url):
    try:
        logger.info(f"=== EMAIL DEBUG INFO ===")
        logger.info(f"EMAIL_BACKEND: {settings.EMAIL_BACKEND}")
        logger.info(f"EMAIL_HOST: {settings.EMAIL_HOST}")
        logger.info(f"EMAIL_PORT: {settings.EMAIL_PORT}")
        logger.info(f"EMAIL_USE_TLS: {settings.EMAIL_USE_TLS}")
        logger.info(f"EMAIL_HOST_USER: {settings.EMAIL_HOST_USER}")
        logger.info(f"DEFAULT_FROM_EMAIL: {settings.DEFAULT_FROM_EMAIL}")

        subject = 'Password Reset Request - WhiteBox'
        
        # Try multiple template paths with fallbacks
        html_message = None
        template_paths = [
            'email/password_reset_email.html',
            'password_reset_email.html',
        ]
        
        for template_path in template_paths:
            try:
                html_message = render_to_string(template_path, {
                    'user': user,
                    'reset_url': reset_url,
                })
                logger.info(f"Successfully rendered template: {template_path}")
                break
            except TemplateDoesNotExist:
                logger.warning(f"Template not found: {template_path}, trying next...")
                continue
            except Exception as template_error:
                logger.warning(f"Error rendering template {template_path}: {str(template_error)}, trying next...")
                continue
        
        # If no template worked, create a plain text fallback
        if html_message is None:
            logger.warning("No HTML template found, using plain text fallback")
            plain_message = f"""
            Password Reset Request
            
            Hello {user.first_name},
            
            We received a request to reset your password. Click the link below to reset it:
            
            {reset_url}
            
            If you didn't request this, please ignore this email.
            This link will expire in 24 hours.
            
            Best regards,
            WhiteBox Team
            """
            html_message = None
        else:
            plain_message = strip_tags(html_message)
        
        logger.info(f"Attempting to send password reset email to {user.email}")
        
        # Use the fallback function
        result = send_email_with_fallback(
            subject=subject,
            plain_message=plain_message,
            recipient_list=[user.email],
            html_message=html_message
        )
            
        logger.info(f"Password reset email sent to {user.email}. Result: {result}")
        return result
        
    except BadHeaderError:
        logger.error("Invalid header found in email")
        raise ValidationError("Invalid email header")
    except Exception as e:
        logger.error(f"Failed to send password reset email to {user.email}: {str(e)}", exc_info=True)
        raise

def send_welcome_email(user, temp_password):
    try:
        logger.info(f"=== EMAIL DEBUG INFO ===")
        logger.info(f"EMAIL_BACKEND: {settings.EMAIL_BACKEND}")
        logger.info(f"EMAIL_HOST: {settings.EMAIL_HOST}")
        logger.info(f"EMAIL_PORT: {settings.EMAIL_PORT}")
        logger.info(f"EMAIL_USE_TLS: {settings.EMAIL_USE_TLS}")
        logger.info(f"EMAIL_HOST_USER: {settings.EMAIL_HOST_USER}")
        logger.info(f"DEFAULT_FROM_EMAIL: {settings.DEFAULT_FROM_EMAIL}")
        
        subject = 'Welcome to WhiteBox'
        
        # Create both plain text and HTML messages
        plain_message = f"""
        Hello {user.first_name},
        
        Your WhiteBox account has been created. 
        Please use the following temporary password to log in:
        
        Temporary Password: {temp_password}
        
        You will be prompted to change your password on first login.
        
        Login here: {settings.FRONTEND_URL}/login
        
        Best regards,
        WhiteBox Team
        """
        
        html_message = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Welcome to WhiteBox</title>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .button {{ display: inline-block; padding: 10px 20px; background-color: #007bff; 
                         color: white; text-decoration: none; border-radius: 5px; }}
                .password {{ background-color: #f8f9fa; padding: 10px; border-radius: 5px; 
                           font-family: monospace; font-weight: bold; }}
                .footer {{ margin-top: 20px; font-size: 12px; color: #666; }}
            </style>
        </head>
        <body>
            <div class="container">
                <h2>Welcome to WhiteBox</h2>
                <p>Hello {user.first_name},</p>
                <p>Your WhiteBox account has been created. Please use the following temporary password to log in:</p>
                
                <div class="password">
                    Temporary Password: {temp_password}
                </div>
                
                <p>You will be prompted to change your password on first login.</p>
                
                <p>
                    <a href="{settings.FRONTEND_URL}/login" class="button">Click here to login</a>
                </p>
                
                <div class="footer">
                    <p>If you didn't request this account, please contact support.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        logger.info(f"Attempting to send welcome email to {user.email}")
        
        # Use the fallback function
        result = send_email_with_fallback(
            subject=subject,
            plain_message=plain_message,
            recipient_list=[user.email],
            html_message=html_message
        )
        
        logger.info(f"Welcome email sent to {user.email}. Result: {result}")
        return result
    except Exception as e:
        logger.error(f"Failed to send welcome email to {user.email}: {str(e)}")
        raise