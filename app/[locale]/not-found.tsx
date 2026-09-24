"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";;

export default function NotFound() {
  const t = useTranslations("NotFoundPage");
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
      <h2 className="text-5xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
        404
      </h2>
      <h3 className="text-2xl font-semibold text-zinc-800 dark:text-zinc-200 mb-4">
        {t("title")}
      </h3>
      <p className="text-zinc-600 dark:text-zinc-400 mb-8 max-w-md">
        {t("description")}
      </p>
      
      <button
        onClick={() => router.back()}
        className="px-6 py-2 rounded-md bg-orange-600 text-white hover:bg-orange-700 transition-colors font-medium"
      >
        {t("goBack")}
      </button>
    </div>
  );
}
