import { getWarehouseById } from "@/app/actions/warehouse";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import WarehouseDetailClient from "./_components/warehouse-detail-client";

interface PageProps {
  params: Promise<{ locale: string; id: string }>;
}

export default async function WarehouseDetailPage({ params }: PageProps) {
  const { id } = await params;
  
  const response = await getWarehouseById(id);
  
  if (!response.success || !response.data) {
    notFound();
  }

  return <WarehouseDetailClient warehouse={response.data} />;
}
