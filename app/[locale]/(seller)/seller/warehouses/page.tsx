import { getTranslations } from "next-intl/server";
import { getWarehousesForDashboard } from "@/app/actions/warehouse";
import WarehouseClient from "./_components/warehouse-client";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function WarehousesPage({ params }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "WarehousePage" });

  const response = await getWarehousesForDashboard();
  const warehouses = response.success ? response.data : [];

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-zinc-500 mt-1">{t("subtitle")}</p>
      </div>

      <WarehouseClient initialWarehouses={warehouses as any} locale={locale} />
    </div>
  );
}
