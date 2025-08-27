from pathlib import Path
import json
from typing import Literal

from ninja import Router
from ninja.errors import HttpError

from .schemas_i18n import MessagesSchema

router = Router(tags=["i18n"])

# Если файлы лежат в app/core/i18n/messages/*.json:
MESSAGES_DIR = Path(__file__).resolve().parent / "i18n" / "messages"
SUPPORTED = {"ru", "en"}


@router.get("/messages/{locale}", response=MessagesSchema)
def get_messages(request, locale: Literal["ru", "en"]):
    fp = MESSAGES_DIR / f"{locale}.json"
    if not fp.exists():
        raise HttpError(404, "messages file not found")
    data = json.loads(fp.read_text(encoding="utf-8"))
    msg = MessagesSchema.model_validate(data)

    return msg
