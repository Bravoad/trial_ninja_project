"use client";

import {useEffect, useRef, useState} from "react";
import {useLocale, useTranslations} from "next-intl";
import DOMPurify from "isomorphic-dompurify";
import {Article, SearchHit} from "@/lib/types";
import {apiListArticles, apiSearch, apiCreateArticle, apiDeleteArticle} from "@/lib/api";
import LocaleSwitch from "@/components/LocaleSwitch";

export default function Home() {
  const locale = (useLocale() as "ru" | "en") ?? "ru";
  const t = useTranslations();

  const [q, setQ] = useState("");
  const debouncedQ = useDebounce(q, 300);
  const [hits, setHits] = useState<SearchHit[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const [latest, setLatest] = useState<Article[]>([]);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(5);
  const [offset, setOffset] = useState(0);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tagsStr, setTagsStr] = useState("");

  useEffect(() => {
    if (!debouncedQ) { setHits(null); return; }
    setLoading(true);
    setError(null);
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    apiSearch(debouncedQ, locale, 10)
      .then(setHits)
      .catch((e) => { console.error(e); setError(t("errors.search")); })
      .finally(() => setLoading(false));

    return () => ac.abort();
  }, [debouncedQ, locale, t]);

  useEffect(() => {
    setError(null);
    apiListArticles(locale, limit, offset)
      .then((page) => { setLatest(page.items); setTotal(page.total); })
      .catch((e) => { console.error(e); setError(t("errors.list")); });
  }, [locale, limit, offset, t]);

  const canCreate = title.trim().length > 0 && body.trim().length > 0;
  const onCreate = async () => {
    try {
      setError(null);
      const tags = tagsStr.split(",").map(s => s.trim()).filter(Boolean);
      await apiCreateArticle(locale, { title, body, tags });
      setTitle(""); setBody(""); setTagsStr("");
      setOffset(0);
      const page = await apiListArticles(locale, limit, 0);
      setLatest(page.items); setTotal(page.total);
    } catch (e) {
      console.error(e);
      setError(t("errors.create"));
    }
  };

  const onDelete = async (id: number) => {
    try {
      await apiDeleteArticle(id);
      const page = await apiListArticles(locale, limit, offset);
      setLatest(page.items); setTotal(page.total);
    } catch (e) {
      console.error(e);
      setError(t("errors.list"));
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const pageIndex = Math.floor(offset / limit) + 1;

  return (
    <main style={{ maxWidth: 800, margin: "0 auto", padding: 16 }}>
      <header style={{display: "flex", alignItems: "center", gap: 12, justifyContent: "space-between"}}>
        <h1 style={{ fontSize: 28, marginBottom: 8 }}>{t("app.title")}</h1>
        <LocaleSwitch />
      </header>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={t("search.placeholder")}
        aria-label="search"
        style={{ width: "100%", padding: 12, border: "1px solid #ccc", borderRadius: 8, fontSize: 16 }}
      />
      {loading && <p style={{ marginTop: 12 }}>{t("search.searching")}</p>}
      {error && <p style={{ marginTop: 12, color: "#b10000" }}>{error}</p>}

      {hits && hits.length > 0 && (
        <ul style={{ listStyle: "none", padding: 0, marginTop: 16 }}>
          {hits.map(h => (
            <li key={h.id} style={{ border: "1px solid #eee", borderRadius: 12, padding: 12, marginBottom: 12 }}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>{h.title}</div>
              <div dangerouslySetInnerHTML={{ __html: sanitizeHighlight(h.snippet) }} />
              {h.tags?.length ? (
                <div style={{ marginTop: 6, fontSize: 12, color: "#666" }}># {h.tags.join("  ")}</div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
      {hits && hits.length === 0 && <p style={{ marginTop: 16 }}>{t("search.noResults")}</p>}

      {!q && (
        <section style={{ marginTop: 28, padding: 12, border: "1px solid #eee", borderRadius: 12 }}>
          <h2 style={{ margin: 0, marginBottom: 12 }}>{t("create.title")}</h2>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t("create.placeholder.title")}
            style={{ width: "100%", padding: 10, border: "1px solid #ccc", borderRadius: 8, marginBottom: 8 }}
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={t("create.placeholder.body")}
            rows={5}
            style={{ width: "100%", padding: 10, border: "1px solid #ccc", borderRadius: 8, marginBottom: 8, fontFamily: "inherit" }}
          />
          <input
            value={tagsStr}
            onChange={(e) => setTagsStr(e.target.value)}
            placeholder={t("create.placeholder.tags")}
            style={{ width: "100%", padding: 10, border: "1px solid #ccc", borderRadius: 8 }}
          />
          <div style={{ marginTop: 10 }}>
            <button
              onClick={onCreate}
              disabled={!canCreate}
              style={{
                padding: "10px 14px",
                borderRadius: 10,
                border: "1px solid #ccc",
                background: canCreate ? "#0f766e" : "#ccc",
                color: "#fff",
                cursor: canCreate ? "pointer" : "not-allowed"
              }}
            >
              {t("actions.create")}
            </button>
          </div>
        </section>
      )}

      {!q && (
        <>
          <h2 style={{ marginTop: 24 }}>{t("list.latest")}</h2>
          <ul style={{ listStyle: "none", padding: 0 }}>
            {latest.map(a => (
              <li key={a.id} style={{ padding: 12, borderBottom: "1px solid #eee", display: "flex", gap: 8, alignItems: "start" }}>
                <div style={{ flex: 1 }}>
                  <b>{a.title}</b>
                  <div style={{ color: "#666", marginTop: 4 }}>{a.body.slice(0, 180)}…</div>
                  <div style={{ marginTop: 6, fontSize: 12, color: "#777" }}># {a.tags.join("  ")}</div>
                </div>
                <button
                  onClick={() => onDelete(a.id)}
                  style={{ border: "1px solid #ddd", borderRadius: 8, padding: "6px 10px", background: "#fff", cursor: "pointer" }}
                >
                  {t("actions.delete")}
                </button>
              </li>
            ))}
          </ul>

          <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 12 }}>
            <button
              onClick={() => setOffset(Math.max(0, offset - limit))}
              disabled={offset === 0}
              style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #ddd", background: "#fff", cursor: offset === 0 ? "not-allowed" : "pointer" }}
            >
              ← {t("list.prev")}
            </button>
            <span style={{ fontSize: 14, color: "#555" }}>
              {pageIndex} / {totalPages}
            </span>
            <button
              onClick={() => setOffset(Math.min((totalPages - 1) * limit, offset + limit))}
              disabled={pageIndex >= totalPages}
              style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #ddd", background: "#fff", cursor: pageIndex >= totalPages ? "not-allowed" : "pointer" }}
            >
              {t("list.next")} →
            </button>

            <select
              value={limit}
              onChange={(e) => { setOffset(0); setLimit(parseInt(e.target.value, 10)); }}
              style={{ marginLeft: "auto", padding: 6, borderRadius: 8, border: "1px solid #ddd" }}
            >
              {[5, 10, 20].map(n => <option key={n} value={n}>{t("list.perPage", {count: n})}</option>)}
            </select>
          </div>
        </>
      )}
    </main>
  );
}

function useDebounce<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => { const id = setTimeout(() => setDebounced(value), delay); return () => clearTimeout(id); }, [value, delay]);
  return debounced;
}

function sanitizeHighlight(html: string) {
  return DOMPurify.sanitize(html, { ALLOWED_TAGS: ["mark"], ALLOWED_ATTR: [] });
}
