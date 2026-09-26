import { getSellerOrderDetail } from "@/app/actions/orders";
import { redirect } from "next/navigation";;
import OrderDetailClient from "./_components/order-detail-client";
import { useLocale } from "next-intl";

export default async function SellerOrderDetailPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { id, locale } = await params;

  const res = await getSellerOrderDetail(id);

  if (!res.success || !res.data) {
    redirect(`/${locale}/seller/orders`);
  }

  return (
    <div className="max-w-5xl mx-auto py-6">
      <OrderDetailClient shipment={res.data} />
    </div>
  );
}
