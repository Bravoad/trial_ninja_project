from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from app.core.models import Article
from app.core.search import index_article, delete_article


@receiver(post_save, sender=Article)
def on_article_save(sender, instance: Article, **kwargs):
    index_article(instance)


@receiver(post_delete, sender=Article)
def on_article_delete(sender, instance: Article, **kwargs):
    delete_article(instance.id)
