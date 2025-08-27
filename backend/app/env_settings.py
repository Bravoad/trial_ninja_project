import os, re


def env_bool(name: str, default: str = "0") -> bool:
    return (os.getenv(name, default) or "").strip().lower() in {"1","true","yes","on"}


def env_urls(name: str, default: str = "") -> list[str]:
    raw = (os.getenv(name, default) or "").strip()
    items = [x.strip() for x in raw.split(",") if x and x.strip()]
    out = []
    for u in items:
        if not re.match(r"^https?://", u):
            u = f"http://{u}"
        out.append(u.rstrip("/"))
    return out
