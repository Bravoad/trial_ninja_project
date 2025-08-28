from modeltranslation.translator import register, TranslationOptions
from .models import Article


@register(Article)
class ArticleTR(TranslationOptions):
    fields = ("title", "body")
