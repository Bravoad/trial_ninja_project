export function stripTrailingSlash(u: string) {
  return u.replace(/\/+$/, '');
}

export function getServerApiBase(): string {
  const base =
    process.env.SERVER_API_BASE ||
    process.env.NEXT_PUBLIC_API_BASE || // запасной вариант
    'http://localhost:8000/api';
  return stripTrailingSlash(base);
}
