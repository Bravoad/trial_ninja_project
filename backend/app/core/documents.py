# app/core/documents.py
from django.conf import settings
from django_elasticsearch_dsl import Document, fields
from django_elasticsearch_dsl.registries import registry

from .models import Article

@registry.register_document
class ArticleDocument(Document):
    # Текстовые поля с языковыми анализаторами + raw для сортировок/агрегаций
    title_ru = fields.TextField(
        analyzer="ru_an",
        fields={"raw": fields.KeywordField(normalizer="lowercase", ignore_above=256)},
    )
    body_ru = fields.TextField(analyzer="ru_an")

    title_en = fields.TextField(
        analyzer="en_an",
        fields={"raw": fields.KeywordField(normalizer="lowercase", ignore_above=256)},
    )
    body_en = fields.TextField(analyzer="en_an")

    tags = fields.KeywordField(normalizer="lowercase", ignore_above=256)

    class Index:
        name = settings.ES_INDEX  # например "articles"
        settings = {
            "number_of_shards": 1,
            "number_of_replicas": 0,
            "analysis": {
                "analyzer": {
                    "ru_an": {"type": "russian"},
                    "en_an": {
                        "type": "custom",
                        "tokenizer": "standard",
                        "filter": ["lowercase", "english_stemmer", "asciifolding"],
                        "char_filter": [],
                    },
                },
                "filter": {
                    "english_stemmer": {"type": "stemmer", "language": "english"},
                },
                "normalizer": {
                    "lowercase": {"type": "custom", "filter": ["lowercase"]},
                },
            },
        }

    class Django:
        model = Article
        fields = ["id", "created_at"]
