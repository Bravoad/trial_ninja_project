from django.utils import translation
from django.conf import settings

SUPPORTED = {code for code, _ in getattr(settings, "LANGUAGES", [("ru", "Russian"), ("en", "English")])}

class QueryStringLocaleMiddleware:
    """
    Активирует язык из ?lang=ru|en для текущего запроса.
    Работает вместе с Django LocaleMiddleware.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        lang = request.GET.get("lang")
        if lang:
            lang = lang[:2]
            if lang in SUPPORTED:
                translation.activate(lang)
                request.LANGUAGE_CODE = lang
        response = self.get_response(request)
        translation.deactivate()
        return response
