from django.contrib import admin
from django.urls import path
from ninja import NinjaAPI

from app.core.api import router as core_router
from app.core.search_api import router as search_router
from app.core.i18n_api import router as i18n_router

api = NinjaAPI(title="Trial API", version="1.0")

api.add_router("/", core_router)
api.add_router("/search", search_router)
api.add_router("/i18n", i18n_router)
urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", api.urls),
]
