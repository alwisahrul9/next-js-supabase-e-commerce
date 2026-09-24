import { getTranslations } from "next-intl/server";
import { getSellerReturns } from "@/app/actions/returns";
import ReturnsClient from "./_components/returns-client";
import { Suspense } from "react";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });
  return {
    title: t("sellerReturns")
  };
}

export default async function ReturnsPage({
  searchParams
}: {
  searchParams: Promise<{ page?: string; search?: string; status?: string }>
}) {
  const resolvedSearchParams = await searchParams;
  const page = Number(resolvedSearchParams.page) || 1;
  const search = resolvedSearchParams.search || "";
  const status = resolvedSearchParams.status || "ALL";

  const { returns, pagination } = await getSellerReturns({ page, search, status, limit: 10 });

  return (
    <div className="w-full">
      <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
        <ReturnsClient initialReturns={returns || []} pagination={pagination} />
      </Suspense>
    </div>
  )
}
