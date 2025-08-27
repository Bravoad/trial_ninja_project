from typing import List, Optional, Literal
from ninja import Router, Query
from django.utils import translation

from .schemas import SearchHit
from .documents import ArticleDocument

router = Router(tags=["search"])
MAX_LIMIT = 100
Lang = Literal["ru", "en"]


def _resolve_lang(request, lang: Optional[str]) -> str:
    """
    Приоритет: явный ?lang= → request.LANGUAGE_CODE → translation.get_language() → 'ru'
    """
    raw = (
        lang
        or request.GET.get("lang")
        or getattr(request, "LANGUAGE_CODE", None)
        or translation.get_language()
        or "ru"
    )
    return "en" if str(raw)[:2] == "en" else "ru"


@router.get("", response=List[SearchHit])  # /api/search
def search(
    request,
    q: str,
    limit: int = Query(10, ge=1, le=MAX_LIMIT),
    lang: Optional[Lang] = Query(None),
):
    q = (q or "").strip()
    if not q:
        return []

    use_lang = _resolve_lang(request, lang)

    if use_lang == "ru":
        fields = ["title_ru^2", "body_ru"]
        title_key, body_key, alt_title_key = "title_ru", "body_ru", "title_en"
    else:
        fields = ["title_en^2", "body_en"]
        title_key, body_key, alt_title_key = "title_en", "body_en", "title_ru"

    s = (
        ArticleDocument.search()
        .query("multi_match", query=q, fields=fields, type="best_fields")
        .highlight(title_key, pre_tags=["<mark>"], post_tags=["</mark>"])
        .highlight(body_key, pre_tags=["<mark>"], post_tags=["</mark>"])
    )[:limit]

    r = s.execute()

    items: List[SearchHit] = []
    for h in r.hits:
        # _source как dict
        src = h.to_dict()
        # highlight может быть AttrDict — берём как dict безопасно
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

        # Заголовок: локализованное поле, иначе альтернативное
        title_val = (src.get(title_key) or src.get(alt_title_key) or "") or ""

        # Сниппет: highlight тела; если нет — highlight заголовка; иначе кусок тела/заголовка
        snippet_list = hl.get(body_key) or hl.get(title_key)
        if snippet_list:
            snippet = " … ".join(snippet_list)
        else:
            snippet = (
                src.get(body_key)
                or src.get(title_key)
                or src.get(alt_title_key)
                or ""
            )[:180]

        items.append(
            SearchHit(
                id=int(src["id"]),
                score=getattr(h.meta, "score", None),
                title=title_val,
                snippet=snippet,
                tags=src.get("tags", []),
            )
        )

    return items
