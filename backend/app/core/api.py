from typing import List, Optional, Literal
from django.db import transaction
from django.shortcuts import get_object_or_404
from django.db.models import QuerySet
from ninja import Router, Query
from django.utils import translation

from .models import Article
from .schemas import ArticleIn, ArticleOut, SearchHit, PageArticles, PageSearch

router = Router(tags=["articles"])
MAX_LIMIT = 100
Lang = Literal["ru", "en"]


def _resolve_lang(request, lang: Optional[str]) -> str:
    """lang из query имеет приоритет; иначе из request/middleware; fallback ru."""
    raw = (lang
           or request.GET.get("lang")
           or getattr(request, "LANGUAGE_CODE", None)
           or translation.get_language()
           or "ru")
    return "en" if str(raw)[:2] == "en" else "ru"


@router.get("articles", response=PageArticles)
def list_articles(
    request,
    limit: int = Query(20, ge=1, le=MAX_LIMIT),
    offset: int = Query(0, ge=0),
    lang: Optional[Lang] = Query(None),
):
    use_lang = _resolve_lang(request, lang)
    qs: QuerySet[Article] = Article.objects.order_by("-created_at")
    total = qs.count()
    page = qs[offset:offset + limit]

    with translation.override(use_lang):
        items = [
            ArticleOut(
                id=a.id,
                title=a.title,
                body=a.body,
                tags=a.tags,
                created_at=a.created_at,
            )
            for a in page
        ]

    return PageArticles(total=total, limit=limit, offset=offset, items=items)


@router.post("articles", response=ArticleOut)
@transaction.atomic
def create_article(
    request,
    payload: ArticleIn,
    lang: Optional[Lang] = Query(None),
):
    data = payload.model_dump(exclude_unset=True)
    a = Article(tags=data.pop("tags", []))

    provided_lang_keys = {"title_ru", "body_ru", "title_en", "body_en"} & set(data.keys())
    if provided_lang_keys:
        for k in provided_lang_keys:
            setattr(a, k, data[k])
    else:
        use_lang = _resolve_lang(request, lang)
        if "title" in data:
            setattr(a, f"title_{use_lang}", data["title"])
        if "body" in data:
            setattr(a, f"body_{use_lang}", data["body"])

    a.save()

    with translation.override(_resolve_lang(request, lang)):
        return ArticleOut(id=a.id, title=a.title, body=a.body, tags=a.tags, created_at=a.created_at)


@router.get("articles/{article_id}", response=ArticleOut)
def get_article(request, article_id: int, lang: Optional[Lang] = Query(None)):
    a = get_object_or_404(Article, id=article_id)
    with translation.override(_resolve_lang(request, lang)):
        return ArticleOut(id=a.id, title=a.title, body=a.body, tags=a.tags, created_at=a.created_at)


@router.patch("articles/{article_id}", response=ArticleOut)
@transaction.atomic
def update_article(
    request,
    article_id: int,
    payload: ArticleIn,
    lang: Optional[Lang] = Query(None),
):
    a = get_object_or_404(Article, id=article_id)
    data = payload.model_dump(exclude_unset=True)

    provided_lang_keys = {"title_ru", "body_ru", "title_en", "body_en"} & set(data.keys())
    if provided_lang_keys:
        for k in provided_lang_keys:
            setattr(a, k, data[k])
    else:
        use_lang = _resolve_lang(request, lang)
        if "title" in data:
            setattr(a, f"title_{use_lang}", data["title"])
        if "body" in data:
            setattr(a, f"body_{use_lang}", data["body"])

    if "tags" in data:
        a.tags = data["tags"]

    a.save()

    with translation.override(_resolve_lang(request, lang)):
        return ArticleOut(id=a.id, title=a.title, body=a.body, tags=a.tags, created_at=a.created_at)


@router.delete("articles/{article_id}")
@transaction.atomic
def delete_article_api(request, article_id: int, lang: Optional[Lang] = Query(None)):
    a = get_object_or_404(Article, id=article_id)
    a.delete()
    return {"ok": True}
