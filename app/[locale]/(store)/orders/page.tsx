import React from "react";
import { getTranslations } from "next-intl/server";
import { getBuyerOrders } from "@/app/actions/orders";
import { getBuyerProfileData } from "@/app/actions/profile";
import OrdersClient from "./_components/orders-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });
  return { title: t("storeOrders") };
}

export default async function OrdersPage() {
  const [ordersRes, profileRes] = await Promise.all([
    getBuyerOrders(),
    getBuyerProfileData()
  ]);
  
  const orders = ordersRes.success ? ordersRes.data : [];
  const defaultAddress = profileRes.success && profileRes.data?.addresses?.[0] 
    ? profileRes.data.addresses[0] 
    : null;

  return (
    <div className="min-h-screen bg-zinc-50 py-12">
      <div className="container mx-auto px-4 max-w-5xl">
        <OrdersClient initialOrders={orders} defaultAddress={defaultAddress} />
      </div>
    </div>
  );
}
