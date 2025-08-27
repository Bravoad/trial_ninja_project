import {NextIntlClientProvider} from 'next-intl';
import {fetchMessagesSSR} from '@/i18n/api';

export default async function RootLayout({
  children,
  params
}: {children: React.ReactNode; params: {locale: 'ru'|'en'}}) {
  const {locale} = params;
  const messages = await fetchMessagesSSR(locale);

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
