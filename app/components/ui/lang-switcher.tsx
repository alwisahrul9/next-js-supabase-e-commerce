"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "next/navigation";;
import { ChangeEvent, useTransition } from "react";

export default function LangSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const handleLanguageChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const nextLocale = e.target.value;
    const newPath = pathname.replace(`/${locale}`, `/${nextLocale}`);

    startTransition(() => {
      router.replace(newPath);
    });
  };

  return (
    <select
      defaultValue={locale}
      onChange={handleLanguageChange}
      disabled={isPending}
      className="bg-transparent border-none text-xs dark:text-white font-semibold text-zinc-700 cursor-pointer focus:outline-none focus:ring-0 disabled:opacity-50 pr-2"
    >
      <option value="id">🇮🇩 ID</option>
      <option value="en">🇬🇧 EN</option>
    </select>
  );
}
