from datetime import datetime
from typing import List, Optional
from ninja import Schema, Field


class ArticleIn(Schema):
    title_ru: Optional[str] = None
    title_en: Optional[str] = None
    body_ru: Optional[str] = None
    body_en: Optional[str] = None
    tags: List[str] = Field(default_factory=list)


class ArticleOut(Schema):
    id: int
    title: str
    body: str
    tags: List[str]
    created_at: datetime

class ArticleI18NOut(Schema):
    id: int
    tags: List[str]
    created_at: datetime
    title: str
    body: str
    title_ru: Optional[str] = None
    body_ru:  Optional[str] = None
    title_en: Optional[str] = None
    body_en:  Optional[str] = None

class SearchHit(Schema):
    id: int
    score: Optional[float] = None
    title: str            # локализованный заголовок
    snippet: str          # локализованный сниппет
    tags: List[str]
class PageArticles(Schema):
    total: int
    limit: int
    offset: int
    items: List[ArticleOut]


class PageSearch(Schema):
    total: int
    limit: int
    offset: int
    items: List[SearchHit]

