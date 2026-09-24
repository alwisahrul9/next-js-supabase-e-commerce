"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";;

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("ErrorPage");
  const router = useRouter();

  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
      <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
        {t("title")}
      </h2>
      <p className="text-zinc-600 dark:text-zinc-400 mb-8 max-w-md">
        {t("description")}
      </p>
      
      <div className="flex gap-4 justify-center">
        <button
          onClick={() => router.back()}
          className="px-6 py-2 rounded-md bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors font-medium"
        >
          {t("goBack")}
        </button>
        
        <button
          onClick={() => reset()}
          className="px-6 py-2 rounded-md bg-orange-600 text-white hover:bg-orange-700 transition-colors font-medium"
        >
          {t("tryAgain")}
        </button>
      </div>
    </div>
  );
}
