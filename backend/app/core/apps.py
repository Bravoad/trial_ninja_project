# backend/app/core/apps.py
from django.apps import AppConfig

class CoreConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "app.core"
    verbose_name = "Core"

    def ready(self):
        from . import translation
        from . import signals
