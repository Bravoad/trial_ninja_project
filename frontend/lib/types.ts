// Общие типы под твой бэкенд
export type Article = {
  id: number;
  title: string;
  body: string;
  tags: string[];
  created_at: string; // ISO
};

export type PageArticles = {
  total: number;
  limit: number;
  offset: number;
  items: Article[];
};

export type SearchHit = {
  id: number;
  score?: number | null;
  title: string;
  snippet: string;
  tags: string[];
};
