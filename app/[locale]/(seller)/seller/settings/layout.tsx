"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";;
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const t = useTranslations("SettingsLayout");
  const role = (session?.user as any)?.role;

  // Hapus prefix locale dari pathname
  const segments = pathname.split("/");
  const isId = segments[1] === "id";
  const locale = isId ? "id" : "en";
  const cleanPath = `/${segments.slice(2).join("/")}`;

  const tabs = [
    { name: t("tabs.general"), href: "/seller/settings" },
    ...(role === "SELLER" ? [{ name: t("tabs.employees"), href: "/seller/settings/employees" }] : []),
  ];

  return (
    <div className="max-w-4xl w-full mx-auto pb-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
          {t("title")}
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          {t("description")}
        </p>
      </div>

      <div className="border-b border-zinc-200 dark:border-zinc-800 mb-6">
        <nav className="-mb-px flex space-x-6" aria-label="Tabs">
          {tabs.map((tab) => {
            const isActive = tab.href === "/seller/settings" 
                ? cleanPath === "/seller/settings"
                : cleanPath.startsWith(tab.href);
            
            return (
              <Link
                key={tab.name}
                href={`${tab.href}`}
                className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                  isActive
                    ? "border-orange-500 text-orange-600 dark:text-orange-500"
                    : "border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:border-zinc-700"
                }`}
              >
                {tab.name}
              </Link>
            );
          })}
        </nav>
      </div>

      <div>{children}</div>
    </div>
  );
}
