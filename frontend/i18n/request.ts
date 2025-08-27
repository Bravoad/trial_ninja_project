import {getRequestConfig} from 'next-intl/server';
import {fetchMessagesSSR} from './api';

export default getRequestConfig(async ({locale}) => {
  const loc: 'ru' | 'en' = locale === 'en' ? 'en' : 'ru';
  try {
    const messages = await fetchMessagesSSR(loc);
    return {locale: loc, messages};
  } catch (e) {
    // Если SSR не может достучаться до бэка (docker/localhost) — не падаем
    console.warn('i18n remote failed, fallback to local JSON:', e);
//    const local = await import(`../messages/${loc}.json`);
  //  return {locale: loc, messages: local.default};
  }
});
