export {Link, redirect, usePathname, useRouter} from 'next-intl/navigation';

export const locales = ['ru', 'en'] as const;
export type AppLocale = (typeof locales)[number];
export const defaultLocale: AppLocale = 'ru';

// Префикс всегда /ru и /en
export const localePrefix = 'always';
