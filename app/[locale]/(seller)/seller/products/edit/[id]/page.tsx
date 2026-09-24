"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";;
import { useTranslations, useLocale } from "next-intl"; // 1. Import useTranslations
import { Button } from "@/components/ui/button";

export default function EditProductPage() {
    const locale = useLocale();
  const router = useRouter();
  const [countdown, setCountdown] = useState<number>(10);

  // Inisialisasi hook terjemahan
  const t = useTranslations("EditProduct");

  useEffect(() => {
      const locale = useLocale();
    if (countdown <= 0) {
      router.push(`/${locale}/seller/products`);
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown, router]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center p-4">
      <div className="max-w-xl w-full p-6 border rounded-xl bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="p-4 mb-6 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-dashed border-zinc-300 dark:border-zinc-700">
          <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
            {/* Masukkan variabel seconds ke dalam terjemahan */}
            {t("description", { seconds: countdown })}
          </p>
        </div>

        <div className="flex items-center justify-end">
          <Button
            variant="outline"
            className="w-full sm:w-auto border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <Link href={`/${locale}/seller/products`}>{t("buttonText")}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
