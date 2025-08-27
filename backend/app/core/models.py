from django.db import models

# Create your models here.
class Article(models.Model):
    title = models.CharField(max_length=200, db_index=True)
    body = models.TextField()
    tags = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title