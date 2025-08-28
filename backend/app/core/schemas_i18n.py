from ninja import Schema


class AppSection(Schema):
    title: str


class SearchSection(Schema):
    placeholder: str
    searching: str
    noResults: str


class ErrorsSection(Schema):
    search: str
    list: str
    create: str


class CreatePlaceholders(Schema):
    title: str
    body: str
    tags: str


class CreateSection(Schema):
    title: str
    placeholder: CreatePlaceholders


class ActionsSection(Schema):
    create: str
    delete: str


class ListSection(Schema):
    latest: str
    prev: str
    next: str
    perPage: str


class MessagesSchema(Schema):
    app: AppSection
    search: SearchSection
    errors: ErrorsSection
    create: CreateSection
    actions: ActionsSection
    list: ListSection
