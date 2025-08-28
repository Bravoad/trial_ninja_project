from typing import List, Dict, Any, Optional
from django.utils import translation

from .documents import ArticleDocument


def _resolve_lang(lang_hint: Optional[str] = None) -> str:
    """
    Вернёт 'ru' или 'en'.
    Приоритет: lang_hint -> активный язык Django -> 'ru'
    """
    return (lang_hint or translation.get_language() or "ru")[:2]


def index_article(article) -> None:
    """Обновить/создать документ из модели Article через DEDs."""
    ArticleDocument().update([article], refresh=True)


def delete_article(article_id: int) -> None:
    """Удалить документ по id (хотя сигналы DEDs и так удаляют)."""
    es = ArticleDocument._get_connection()
    index_name = ArticleDocument._index._name
    es.delete(index=index_name, id=article_id, ignore=[404], refresh=True)


# --- Поиск ---
def search_articles(q: str, *, lang: Optional[str] = None, limit: int = 10) -> List[Dict[str, Any]]:
    """
    Ищет по языковым полям индекса и возвращает список hit-ов без total/offset.
    Поля результата совместимы с твоей схемой SearchHit (title_ru/title_en/snippet/tags).
    """
    q = (q or "").strip()
    if not q:
        return []

    lang = _resolve_lang(lang)

    if lang == "ru":
        fields = ["title_ru^2", "body_ru"]
        title_key, body_key = "title_ru", "body_ru"
    else:
        fields = ["title_en^2", "body_en"]
        title_key, body_key = "title_en", "body_en"

    s = (
        ArticleDocument.search()
        .query("multi_match", query=q, fields=fields, type="best_fields")
        .highlight(title_key, pre_tags=["<mark>"], post_tags=["</mark>"])
        .highlight(body_key, pre_tags=["<mark>"], post_tags=["</mark>"])
    )[: max(1, min(limit, 100))]  # простая защита лимита

    r = s.execute()

    items: List[Dict[str, Any]] = []
    for h in r.hits:
        src = h.to_dict()

        hl_obj = getattr(h.meta, "highlight", None)
        if hl_obj:
            try:
                hl = hl_obj.to_dict()
            except Exception:
                try:
                    hl = dict(hl_obj)
                except Exception:
                    hl = {}
        else:
            hl = {}

        snippet_list = hl.get(body_key) or hl.get(title_key)
        if snippet_list:
            snippet = " … ".join(snippet_list)
        else:
            snippet = (src.get(body_key) or src.get(title_key) or "")[:180]

        items.append(
            {
                "id": int(src["id"]),
                "score": getattr(h.meta, "score", None),
                "title_ru": src.get("title_ru") or "",
                "title_en": src.get("title_en") or "",
                "snippet": snippet,
                "tags": src.get("tags", []),
            }
        )

    return items
