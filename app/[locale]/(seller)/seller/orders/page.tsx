import { getTranslations } from "next-intl/server";
import { getSellerOrders } from "@/app/actions/orders";
import OrdersClient from "./_components/orders-client";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });
  return {
    title: t("sellerOrders")
  };
}

export default async function OrderPage() {
  const { data: shipments, warehouses, role } = await getSellerOrders();

  return (
    <div className="w-full">
      <OrdersClient initialShipments={shipments} warehouses={warehouses} role={role} />
    </div>
  )
}

