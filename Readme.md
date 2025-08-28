Next.js + Django-Ninja + Elasticsearch (RU/EN) — демо

Полноценный пример фуллстек-проекта:
Frontend — Next.js (App Router) + next-intl;
Backend — Django + django-ninja + django-modeltranslation + django-elasticsearch-dsl;
Поиск — Elasticsearch (c подсветкой), БД — PostgreSQL.
Интернационализация работает и на фронте, и на бэке; словари (ru/en) отдаются бэком по REST.

Что внутри

CRUD статей (/api/articles, Ninja) с пагинацией.

Поиск (/api/search, ES multi_match + highlight).

Локализация RU/EN:

Backend: django-modeltranslation добавляет title_{lang}/body_{lang}; активная локаль берётся из ?lang/LocaleMiddleware; статичные словари выдаются API /api/i18n/messages/{locale}.

Frontend: next-intl (+ middleware) + переключатель языка; словари тянем с бэка.

Безопасность: подсветку из ES очищаем через DOMPurify (разрешаем только <mark>).

Docker Compose: PostgreSQL, Elasticsearch, Kibana, Backend (Uvicorn), Frontend (Next dev).

collectstatic без nginx: статика собирается в volume staticfiles/.


Быстрый старт (Docker)

Заполни окружения:

backend/.env
```
DJANGO_SECRET_KEY=django-insecure-...            # любой
DJANGO_DEBUG=1
DB_NAME=appdb
DB_USER=app
DB_PASSWORD=app
DB_HOST=postgres
DB_PORT=5432
ALLOWED_HOSTS=
CORS_ORIGINS=http://localhost:3000
CORS_ALLOW_ALL_ORIGINS=1
CSRF_TRUSTED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,http://localhost:8000,http://127.0.0.1:8000
ELASTIC_URL=http://elasticsearch:9200
ES_INDEX=articles
```

frontend/.env.local
(если фронт в контейнере, а бэк на хосте — используй host.docker.internal)

# вариант А: бэк В КОНТЕЙНЕРЕ
```
SERVER_API_BASE=http://backend:8000/api
NEXT_PUBLIC_API_BASE=http://localhost:8000/api
```
# вариант Б: бэк на ХОСТЕ (Windows/Mac)

SERVER_API_BASE=http://host.docker.internal:8000/api
NEXT_PUBLIC_API_BASE=http://host.docker.internal:8000/api


Запусти всё:

docker compose up --build


Сервисы:

Frontend: http://localhost:3000/ru
 (или /en)

Backend (Ninja docs): http://localhost:8000/api/docs

Kibana: http://localhost:5601

Elasticsearch: http://localhost:9200

Бэкенд выполняет: migrate → reindex_articles → uvicorn.

Backend
Модель + локализация

Article (пример): title, body, tags: List[str], created_at.
django-modeltranslation генерирует title_ru/title_en, body_ru/body_en.
Активная локаль определяется так:
```python
def req_lang(request) -> str:
    return (request.GET.get("lang")
            or getattr(request, "LANGUAGE_CODE", None)
            or translation.get_language()
            or "ru")[:2]
```
API (Ninja)

GET /api/articles?limit&offset&lang=ru|en → PageArticles

POST /api/articles?lang=... body: {"title","body","tags":[]}

Если пришли title/body без суффикса — кладём в title_{lang}/body_{lang}.

Можно прислать и явные title_ru/body_ru/....

PATCH /api/articles/{id}?lang=...

DELETE /api/articles/{id}

Поиск (Elasticsearch)

GET /api/search?q=...&limit&lang=ru|en

Для ru ищем по title_ru^2, body_ru, для en — по title_en^2, body_en.

Подсветка <mark> в title/body.

Документ в documents.py, индекс/анализаторы объявлены через Index.settings.

i18n словари (отдаёт бэк)

GET /api/i18n/messages/{locale} → JSON (ru/en), кэшируется на 300 сек.
Фронт забирает эти словари на SSR и на клиенте.

Reindex / сиды

Команда reindex_articles создаёт индекс (если нет) и прокачивает документы.

Примеры сидов в management/commands или через shell (необязательно).

Collect static (без nginx)

В контейнере:
```sh
python manage.py collectstatic --noinput
```

Статика уходит в /app/staticfiles (volume static_volume).
Для прод-сценария добавь WhiteNoise или отдельный статика-сервер — в демо достаточно dev-режима/volume.

Frontend
Маршрутизация и i18n

App Router: директория app/[locale]/...

middleware.ts от next-intl обеспечивает префиксы /ru и /en.

На SSR: i18n/request.ts (getRequestConfig) — фетчит словари с бэка:

const res = await fetch(`${SERVER_API_BASE}/i18n/messages/${locale}`, {cache: 'no-store'});


В dev удобно no-store, в prod можно добавить revalidate.

В layout.tsx:

получаем params.locale,

берём словари getMessages() (использует request.ts),

оборачиваем приложение в NextIntlClientProvider.

Компоненты

LocaleSwitch.tsx — client-компонент, переключает язык путём замены префикса в URL (использует next/navigation).

page.tsx:

Поиск (дебаунс 300 мс), список последних, создание/удаление.

Все вызовы идут через lib/api.ts, который добавляет ?lang=....

Подсветка из ES проходит через DOMPurify:

DOMPurify.sanitize(html, { ALLOWED_TAGS: ["mark"], ALLOWED_ATTR: [] })

Вызовы к API

frontend/lib/api.ts:

apiListArticles(lang, limit, offset) → PageArticles

apiSearch(q, lang, limit) → SearchHit[]

apiCreateArticle(lang, {title, body, tags})

apiPatchArticle(id, lang, payload)

apiDeleteArticle(id)

Конфиги окружения

SERVER_API_BASE — базовый URL бэка для SSR/Node-части (нельзя использовать localhost внутри контейнера → ставим backend:8000 или host.docker.internal).

NEXT_PUBLIC_API_BASE — то же для браузера (как правило http://localhost:8000/api).

Примеры запросов
# Словари i18n
```
curl -s http://localhost:8000/api/i18n/messages/ru

curl -s http://localhost:8000/api/i18n/messages/en
```
# Список статей (ru)
```
curl -s "http://localhost:8000/api/articles?limit=5&offset=0&lang=ru"
```
# Создать статью в текущей локали (en)
```
curl -s -X POST "http://localhost:8000/api/articles?lang=en" \
  -H "Content-Type: application/json" \
  -d '{"title":"Hello","body":"English body","tags":["test","news"]}'
```

# Поиск (ru)
curl -s "http://localhost:8000/api/search?q=django&limit=10&lang=ru"

Типичные проблемы и решения

ERR_CONNECTION_REFUSED с фронта
Проверь SERVER_API_BASE / NEXT_PUBLIC_API_BASE.
В контейнере localhost указывает на сам контейнер, а не на хост:

Бэк в контейнере → SERVER_API_BASE=http://backend:8000/api

Бэк на хосте → SERVER_API_BASE=http://host.docker.internal:8000/api

CORS/CSRF ошибки
В .env добавь CORS_ORIGINS c схемой (http://...) и CSRF_TRUSTED_ORIGINS — тоже со схемой.

Elasticsearch: “analyzer not configured”
Анализаторы должны быть в Index.settings(analysis=...) до создания индекса.
Пересоздай индекс: python manage.py search_index --rebuild -f.

next-intl: invalid message keys с точками
Мы перешли на вложенную структуру JSON (без точек в ключах).

Переключатель языка не меняет контент
Убедись, что:

URL имеет префикс /ru или /en (работает middleware);

На фронте все запросы к бэку добавляют ?lang=....

Поддержать разработчика можно:

DonationAlerts: https://www.donationalerts.com/r/bravoad

Перевод на номер: +7 (981) 435-59-46