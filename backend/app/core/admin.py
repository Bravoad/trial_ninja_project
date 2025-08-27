from django.contrib import admin
from modeltranslation.admin import TranslationAdmin
from .models import Article

@admin.register(Article)
class ArticleAdmin(TranslationAdmin):
    list_display = ("id", "title", "created_at")
    search_fields = ("title", "body")
