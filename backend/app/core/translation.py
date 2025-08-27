from modeltranslation.translator import register, TranslationOptions
from .models import Article

@register(Article)
class ArticleTR(TranslationOptions):
    fields = ("title", "body")  # создаст title_ru, title_en, body_ru, body_en
