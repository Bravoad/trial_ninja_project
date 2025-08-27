"use client";

import {useLocale} from "next-intl";
import {usePathname, useRouter, useSearchParams} from "next/navigation";

type L = "ru" | "en";

function buildLocalizedPath(pathname: string, next: L) {
  const rest = pathname.replace(/^\/(ru|en)(?=\/|$)/, "");
  return `/${next}${rest || ""}`;
}

export default function LocaleSwitch() {
  const locale = (useLocale() as L) ?? "ru";
  const router = useRouter();
  const pathname = usePathname() || "/";
  const searchParams = useSearchParams();

  const onChange = (next: L) => {
    const newPath = buildLocalizedPath(pathname, next);
    const qs = searchParams?.toString();
    const url = qs ? `${newPath}?${qs}` : newPath;

    document.cookie = `NEXT_LOCALE=${next}; Path=/; Max-Age=${60 * 60 * 24 * 365}`;

    router.replace(url);
    router.refresh();
  };

  return (
    <select
      value={locale}
      onChange={(e) => onChange(e.target.value as L)}
      style={{ padding: 6, borderRadius: 8, border: "1px solid #ddd" }}
      aria-label="Select language"
    >
      <option value="ru">Русский</option>
      <option value="en">English</option>
    </select>
  );
}
