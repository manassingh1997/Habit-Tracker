import re
from django.core.exceptions import ValidationError

def validate_password(password):
    if len(password) < 8:
        raise ValidationError("Password must be at least 8 characters long.")
    if not re.search(r'[A-Z]', password):
        raise ValidationError("Password must contain at least one uppercase letter.")
    if not re.search(r'\d', password):
        raise ValidationError("Password must contain at least one number.")
    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        raise ValidationError("Password must contain at least one symbol.")
    
    def get_help_text(self):
        return (
            "Password must be at least 8 characters long and contain at least one uppercase letter, one number, and one symbol."
        )