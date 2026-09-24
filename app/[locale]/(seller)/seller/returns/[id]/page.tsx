import { getTranslations } from "next-intl/server";
import { getReturnDetails } from "@/app/actions/returns";
import { notFound } from "next/navigation";
import ReturnDetailClient from "./_components/return-detail-client";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });
  return {
    title: t("sellerReturns") || "Detail Pengembalian"
  };
}

export default async function ReturnDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { success, returnDetails } = await getReturnDetails(id);

  if (!success || !returnDetails) {
    notFound();
  }

  return (
    <div className="w-full">
      <ReturnDetailClient returnDetails={returnDetails} />
    </div>
  )
}
