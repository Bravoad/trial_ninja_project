import {messagesSchema, type Messages} from './messages-schema';
import {getServerApiBase} from '../lib/api-base';

async function fetchWithFallback(urls: string[]) {
  let lastErr: unknown;
  for (const url of urls) {
    try {
      const res = await fetch(url, { cache: 'no-store' });
      if (res.ok) return res;
      lastErr = new Error(`HTTP ${res.status} at ${url}`);
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr;
}

export async function fetchMessagesSSR(locale: 'ru'|'en'): Promise<Messages> {
  const base = getServerApiBase();
  const primary = `${base}/i18n/messages/${locale}`;

  // фолбэк: если base указывает на localhost/127.0.0.1, пробуем host.docker.internal
  const candidates = [primary];
  if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(base)) {
    const alt = primary
      .replace('http://localhost', 'http://host.docker.internal')
      .replace('http://127.0.0.1', 'http://host.docker.internal');
    candidates.push(alt);
  }

  const res = await fetchWithFallback(candidates);
  const data = await res.json();
  return messagesSchema.parse(data);
}
