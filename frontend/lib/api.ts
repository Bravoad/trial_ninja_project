// frontend/lib/api.ts
import {Article, PageArticles, SearchHit} from "./types";

const API = process.env.NEXT_PUBLIC_API_BASE!;
if (!API) throw new Error("NEXT_PUBLIC_API_BASE не задан. Проверь frontend/.env.local");

type Lang = "ru" | "en";


async function requestJSON<T>(
  url: string,
  lang: Lang,
  init: RequestInit = {},
  signal?: AbortSignal
): Promise<T> {
  const r = await fetch(url, {
    cache: "no-store",
    ...init,
    headers: {
      "Accept-Language": lang,
      ...(init.headers || {})
    },
    signal
  });
  if (!r.ok) {
    const text = await r.text().catch(() => "");
    throw new Error(`${init.method || "GET"} ${url} -> ${r.status} ${text || ""}`.trim());
  }
  return r.json() as Promise<T>;
}

// массив ИЛИ {items: [...]} -> всегда страница
function toPage<T>(data: unknown): { total: number; limit: number; offset: number; items: T[] } {
  if (Array.isArray(data)) {
    const items = data as T[];
    return { total: items.length, limit: items.length, offset: 0, items };
  }
  if (data && typeof data === "object" && Array.isArray((data as any).items)) {
    const p = data as { total?: number; limit?: number; offset?: number; items: T[] };
    return {
      total: typeof p.total === "number" ? p.total : p.items.length,
      limit: typeof p.limit === "number" ? p.limit : p.items.length,
      offset: typeof p.offset === "number" ? p.offset : 0,
      items: p.items
    };
  }
  return { total: 0, limit: 0, offset: 0, items: [] as T[] };
}

function toList<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === "object" && Array.isArray((data as any).items)) return (data as any).items as T[];
  return [];
}

// --- API -------------------------------------------------------------------

export async function apiListArticles(
  lang: Lang,
  limit = 20,
  offset = 0,
  signal?: AbortSignal
): Promise<PageArticles> {
  const url = `${API}/articles?limit=${limit}&offset=${offset}&lang=${lang}`;
  const data = await requestJSON<unknown>(url, lang, {}, signal);
  const page = toPage<Article>(data);
  // возвращаем строго PageArticles
  return { total: page.total, limit: page.limit, offset: page.offset, items: page.items };
}

export async function apiSearch(
  q: string,
  lang: Lang,
  limit = 10,
  signal?: AbortSignal
): Promise<SearchHit[]> {
  if (!q.trim()) return [];
  const url = `${API}/search?q=${encodeURIComponent(q)}&limit=${limit}&lang=${lang}`;
  const data = await requestJSON<unknown>(url, lang, {}, signal);
  return toList<SearchHit>(data);
}

export async function apiCreateArticle(
  lang: Lang,
  payload: { title: string; body: string; tags: string[] },
  signal?: AbortSignal
): Promise<Article> {
  const url = `${API}/articles?lang=${lang}`;
  return requestJSON<Article>(
    url,
    lang,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    },
    signal
  );
}

export async function apiPatchArticle(
  id: number,
  lang: Lang,
  payload: Partial<{ title: string; body: string; tags: string[] }>,
  signal?: AbortSignal
): Promise<Article> {
  const url = `${API}/articles/${id}?lang=${lang}`;
  return requestJSON<Article>(
    url,
    lang,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    },
    signal
  );
}

export async function apiDeleteArticle(id: number, signal?: AbortSignal): Promise<void> {
  const url = `${API}/articles/${id}`;
  await requestJSON<void>(url, "ru", { method: "DELETE" }, signal); // lang тут не важен
}
